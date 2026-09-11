import "server-only";

import { z } from "zod";
import { requireAuthenticatedMutation } from "../auth/authorization";
import { invitationAssetsBucket } from "./invitation-music";

export type StorageSupabaseClient = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

declare const authorizedAssetPathBrand: unique symbol;
export type AuthorizedAssetPath = string & {
	readonly [authorizedAssetPathBrand]: true;
};

export type OwnedInvitationAssetContext = {
	supabase: StorageSupabaseClient;
	userId: string;
	invitationId: string;
};

const invitationIdSchema = z.string().uuid();

export async function requireOwnedInvitationAssetContext(
	invitationId: unknown,
): Promise<OwnedInvitationAssetContext> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	return verifyOwnedInvitationAssetContext(supabase, userId, invitationId);
}

export async function verifyOwnedInvitationAssetContext(
	supabase: StorageSupabaseClient,
	userId: string,
	invitationId: unknown,
): Promise<OwnedInvitationAssetContext> {
	const parsed = invitationIdSchema.safeParse(invitationId);
	if (!parsed.success) throw new Error("Undangan tidak valid.");

	const { data, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsed.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");

	return { supabase, userId, invitationId: String(data.id) };
}

export function authorizeCanonicalAssetPath(
	context: Pick<OwnedInvitationAssetContext, "userId" | "invitationId">,
	path: string,
): AuthorizedAssetPath {
	const segments = path.split("/");
	if (
		segments.length < 4 ||
		segments[0] !== context.userId ||
		segments[1] !== context.invitationId ||
		segments.some(
			(segment) =>
				segment.length === 0 ||
				segment === "." ||
				segment === ".." ||
				segment.includes("\\") ||
				segment.includes("%"),
		)
	) {
		throw new Error("Path asset undangan tidak valid.");
	}
	return path as AuthorizedAssetPath;
}

export async function createAuthorizedSignedUploadUrl(
	context: OwnedInvitationAssetContext,
	path: AuthorizedAssetPath,
	options: { upsert?: boolean; errorMessage: string },
) {
	const { data, error } = await context.supabase.storage
		.from(invitationAssetsBucket)
		.createSignedUploadUrl(path, { upsert: options.upsert ?? false });
	if (error || !data) throw new Error(options.errorMessage);
	return data.signedUrl;
}

export async function createAuthorizedSignedReadUrls(
	context: OwnedInvitationAssetContext,
	paths: AuthorizedAssetPath[],
	expiresIn: number,
) {
	if (paths.length === 0) return {};
	const { data, error } = await context.supabase.storage
		.from(invitationAssetsBucket)
		.createSignedUrls(paths, expiresIn);
	if (error || !data) throw new Error("Gagal mengotorisasi asset preview.");

	const signedUrls: Record<string, string> = {};
	for (const signed of data) {
		if (
			signed.path &&
			signed.signedUrl &&
			paths.includes(signed.path as AuthorizedAssetPath)
		) {
			signedUrls[signed.path] = signed.signedUrl;
		}
	}
	return signedUrls;
}
