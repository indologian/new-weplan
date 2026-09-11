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
	outcome: "complete" | "already-absent" | "partial-failure";
	deleted: AuthorizedAssetPath[];
	alreadyAbsent: AuthorizedAssetPath[];
	failed: Array<{ path: AuthorizedAssetPath; message: string }>;
};

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
): Promise<AssetCleanupResult> {
	const deleted: AuthorizedAssetPath[] = [];
	const alreadyAbsent: AuthorizedAssetPath[] = [];
	const failed: AssetCleanupResult["failed"] = [];

	for (const path of [...new Set(paths)]) {
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
				: deleted.length === 0
					? "already-absent"
					: "complete",
		deleted,
		alreadyAbsent,
		failed,
	};
}

const uuidSchema = z.string().uuid();

async function enumerateInvitationPaths(
	storage: StorageBucketClient,
	prefix: string,
) {
	const paths: string[] = [];
	const folders = [prefix.replace(/\/$/, "")];
	while (folders.length > 0) {
		const folder = folders.shift();
		if (!folder) continue;
		let offset = 0;
		for (;;) {
			const { data, error } = await storage.list(folder, {
				limit: 100,
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
	}
	return paths;
}

export async function cleanupTrustedInvitationAssets(
	coupleId: string,
	invitationId: string,
) {
	const owner = uuidSchema.parse(coupleId);
	const invitation = uuidSchema.parse(invitationId);
	const admin = createAdminClient();
	const storage = admin.storage.from(invitationAssetsBucket);
	const rawPaths = await enumerateInvitationPaths(
		storage,
		`${owner}/${invitation}/`,
	);
	const paths = rawPaths.map((path) =>
		authorizeCanonicalAssetPath(
			{ userId: owner, invitationId: invitation },
			path,
		),
	);
	return cleanupAuthorizedAssets(storage, paths);
}

export async function cleanupOwnedInvitationAssets(invitationId: unknown) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	return cleanupTrustedInvitationAssets(context.userId, context.invitationId);
}
