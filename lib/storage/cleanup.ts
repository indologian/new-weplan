import "server-only";

import { z } from "zod";
import { createAdminClient } from "../supabase/admin";
import type {
	AuthorizedAssetPath,
	StorageSupabaseClient,
} from "./authorized-assets";
import {
	authorizeCanonicalAssetPath,
	requireOwnedInvitationAssetContext,
} from "./authorized-assets";
import { invitationAssetsBucket } from "./invitation-music";

type StorageBucketClient = ReturnType<StorageSupabaseClient["storage"]["from"]>;

export type AssetCleanupResult = {
	outcome: "complete" | "already-absent" | "incomplete" | "partial-failure";
	deleted: AuthorizedAssetPath[];
	alreadyAbsent: AuthorizedAssetPath[];
	failed: Array<{ path: AuthorizedAssetPath; message: string }>;
	traversalComplete: boolean;
	listRequests: number;
};

export type LifecycleStorageLimits = {
	maxListRequests: number;
	maxBulkDeletePaths: number;
};

export const lifecycleStorageLimits: LifecycleStorageLimits = {
	maxListRequests: 8,
	maxBulkDeletePaths: 1000,
} as const;

function isMissingObjectError(error: unknown) {
	if (!error || typeof error !== "object") return false;
	const value = error as { status?: number; statusCode?: number | string };
	return value.status === 404 || Number(value.statusCode) === 404;
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Storage operation failed";
}

export async function cleanupAuthorizedAssets(
	storage: StorageBucketClient,
	paths: AuthorizedAssetPath[],
	options: {
		bulk?: boolean;
		traversalComplete?: boolean;
		listRequests?: number;
	} = {},
): Promise<AssetCleanupResult> {
	const deleted: AuthorizedAssetPath[] = [];
	const alreadyAbsent: AuthorizedAssetPath[] = [];
	const failed: AssetCleanupResult["failed"] = [];
	const uniquePaths = [...new Set(paths)];

	if (options.bulk && uniquePaths.length > 0) {
		const { error } = await storage.remove(uniquePaths);
		if (error) {
			for (const path of uniquePaths) {
				failed.push({ path, message: errorMessage(error) });
			}
		} else {
			deleted.push(...uniquePaths);
		}
	}

	for (const path of options.bulk ? [] : uniquePaths) {
		const { data: object, error: infoError } = await storage.info(path);
		if (infoError || !object) {
			if (!object && (!infoError || isMissingObjectError(infoError))) {
				alreadyAbsent.push(path);
			} else {
				failed.push({ path, message: errorMessage(infoError) });
			}
			continue;
		}

		const { error: removeError } = await storage.remove([path]);
		if (!removeError) deleted.push(path);
		else if (isMissingObjectError(removeError)) alreadyAbsent.push(path);
		else failed.push({ path, message: errorMessage(removeError) });
	}

	return {
		outcome:
			failed.length > 0
				? "partial-failure"
				: options.traversalComplete === false
					? "incomplete"
					: deleted.length === 0
						? "already-absent"
						: "complete",
		deleted,
		alreadyAbsent,
		failed,
		traversalComplete: options.traversalComplete !== false,
		listRequests: options.listRequests ?? 0,
	};
}

const uuidSchema = z.string().uuid();

async function enumerateInvitationPaths(
	storage: StorageBucketClient,
	prefix: string,
	maxListRequests: number,
	maxPaths: number,
) {
	const paths: string[] = [];
	const folders = [prefix.replace(/\/$/, "")];
	let listRequests = 0;
	let complete = true;
	while (folders.length > 0 && paths.length < maxPaths) {
		const folder = folders.shift();
		if (!folder) continue;
		let offset = 0;
		for (;;) {
			if (listRequests >= maxListRequests || paths.length >= maxPaths) {
				complete = false;
				break;
			}
			listRequests += 1;
			const { data, error } = await storage.list(folder, {
				limit: Math.min(100, maxPaths - paths.length),
				offset,
				sortBy: { column: "name", order: "asc" },
			});
			if (error || !data) throw new Error("Gagal membaca asset undangan.");
			for (const entry of data) {
				const child = `${folder}/${entry.name}`;
				if (entry.id) paths.push(child);
				else folders.push(child);
			}
			if (data.length < 100) break;
			offset += data.length;
		}
		if (!complete) break;
	}
	if (folders.length > 0) complete = false;
	return { paths, complete, listRequests };
}

export async function cleanupTrustedInvitationAssets(
	coupleId: string,
	invitationId: string,
	limits: LifecycleStorageLimits = lifecycleStorageLimits,
) {
	const owner = uuidSchema.parse(coupleId);
	const invitation = uuidSchema.parse(invitationId);
	const admin = createAdminClient();
	const storage = admin.storage.from(invitationAssetsBucket);
	const enumeration = await enumerateInvitationPaths(
		storage,
		`${owner}/${invitation}/`,
		limits.maxListRequests,
		limits.maxBulkDeletePaths,
	);
	const paths = enumeration.paths.map((path) =>
		authorizeCanonicalAssetPath(
			{ userId: owner, invitationId: invitation },
			path,
		),
	);
	return cleanupAuthorizedAssets(storage, paths, {
		bulk: true,
		traversalComplete: enumeration.complete,
		listRequests: enumeration.listRequests,
	});
}

export async function cleanupOwnedInvitationAssets(invitationId: unknown) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	return cleanupTrustedInvitationAssets(context.userId, context.invitationId);
}
