import "server-only";

import type {
	AuthorizedAssetPath,
	StorageSupabaseClient,
} from "./authorized-assets";
import { invitationAssetsBucket } from "./invitation-music";

export const maxOptimizedImageBytes = 500 * 1024;

type StorageBucketClient = ReturnType<StorageSupabaseClient["storage"]["from"]>;

export async function requireStoredOptimizedImage(
	storage: StorageBucketClient,
	path: AuthorizedAssetPath,
) {
	const { data, error } = await storage.info(path);
	if (error || !data) throw new Error("Gambar belum berhasil diunggah.");
	if (data.contentType !== "image/webp") {
		throw new Error("Format gambar tersimpan tidak valid.");
	}
	if (typeof data.size !== "number" || data.size > maxOptimizedImageBytes) {
		throw new Error("Ukuran gambar tersimpan melebihi 500 KB.");
	}
	return { path, size: data.size, contentType: data.contentType };
}

export function getInvitationAssetStorage(supabase: StorageSupabaseClient) {
	return supabase.storage.from(invitationAssetsBucket);
}
