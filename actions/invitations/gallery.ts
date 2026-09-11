"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { authorizeCanonicalAssetPath } from "../../lib/storage/authorized-assets";
import { cleanupAuthorizedAssets } from "../../lib/storage/cleanup";
import { getGalleryImagePath } from "../../lib/storage/gallery-image";
import {
	type GalleryItem,
	galleryInvitationIdSchema,
	galleryItemIdSchema,
	reorderGallerySchema,
} from "../../validations/gallery";
import { normalizeYouTubeVideoId } from "../../validations/youtube-video";
import { getGalleryActionError } from "./gallery-errors";

type SupabaseClient = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];
const galleryColumns = "id,type,image_path,youtube_video_id,sort_order";

function mapItem(row: Record<string, unknown>): GalleryItem {
	return {
		id: String(row.id),
		type: row.type === "image" ? "image" : "youtube",
		imagePath: row.image_path === null ? null : String(row.image_path),
		youtubeVideoId:
			row.youtube_video_id === null ? null : String(row.youtube_video_id),
		sortOrder: Number(row.sort_order),
	};
}

async function requireOwnedInvitation(
	supabase: SupabaseClient,
	userId: string,
	invitationId: string,
) {
	const parsed = galleryInvitationIdSchema.safeParse(invitationId);
	if (!parsed.success) throw new Error("Undangan tidak valid.");
	const { data, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsed.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");
	return parsed.data;
}

async function requireOwnedItem(
	supabase: SupabaseClient,
	invitationId: string,
	itemId: string,
) {
	const parsed = galleryItemIdSchema.safeParse(itemId);
	if (!parsed.success) throw new Error("Item galeri tidak valid.");
	const { data, error } = await supabase
		.from("gallery_items")
		.select(galleryColumns)
		.eq("id", parsed.data)
		.eq("invitation_id", invitationId)
		.maybeSingle();
	if (error || !data) throw new Error("Item galeri tidak ditemukan.");
	return data;
}

export async function getGalleryItems(invitationId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedId = await requireOwnedInvitation(supabase, userId, invitationId);
	const { data, error } = await supabase
		.from("gallery_items")
		.select(galleryColumns)
		.eq("invitation_id", ownedId)
		.order("sort_order", { ascending: true })
		.range(0, 9999);
	if (error) throw new Error("Gagal memuat galeri.");
	return (data ?? []).map((row) => mapItem(row));
}

export async function createYouTubeGalleryItem(
	invitationId: string,
	input: unknown,
) {
	const { supabase } = await requireAuthenticatedMutation();
	const parsedInvitationId = galleryInvitationIdSchema.safeParse(invitationId);
	if (!parsedInvitationId.success) throw new Error("Undangan tidak valid.");
	const videoId = normalizeYouTubeVideoId(input);
	const { data, error } = await supabase.rpc("create_gallery_item_atomic", {
		p_invitation_id: parsedInvitationId.data,
		p_gallery_item_id: crypto.randomUUID(),
		p_media_type: "youtube",
		p_youtube_video_id: videoId,
	});
	if (error || !data?.[0]) throw getGalleryActionError(error);
	return mapItem(data[0]);
}

export async function updateYouTubeGalleryItem(
	invitationId: string,
	itemId: string,
	input: unknown,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedId = await requireOwnedInvitation(supabase, userId, invitationId);
	const item = await requireOwnedItem(supabase, ownedId, itemId);
	if (item.type !== "youtube")
		throw new Error("Jenis media tidak dapat diubah.");
	const videoId = normalizeYouTubeVideoId(input);
	const { data, error } = await supabase
		.from("gallery_items")
		.update({ image_path: null, youtube_video_id: videoId })
		.eq("id", item.id)
		.eq("invitation_id", ownedId)
		.select(galleryColumns)
		.single();
	if (error || !data) throw new Error("Gagal memperbarui video.");
	return mapItem(data);
}

export async function deleteGalleryItem(invitationId: string, itemId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedId = await requireOwnedInvitation(supabase, userId, invitationId);
	const item = await requireOwnedItem(supabase, ownedId, itemId);
	if (item.type === "image") {
		const path = authorizeCanonicalAssetPath(
			{ userId, invitationId: ownedId },
			getGalleryImagePath(userId, ownedId, String(item.id)),
		);
		const cleanup = await cleanupAuthorizedAssets(
			supabase.storage.from("invitation-assets"),
			[path],
		);
		if (cleanup.outcome === "partial-failure") {
			throw new Error("Gagal membersihkan gambar galeri.");
		}
	}
	const { error } = await supabase
		.from("gallery_items")
		.delete()
		.eq("id", item.id)
		.eq("invitation_id", ownedId)
		.select("id")
		.maybeSingle();
	if (error) throw new Error("Gagal menghapus item galeri.");
}

export async function reorderGalleryItems(
	invitationId: string,
	itemIds: string[],
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedId = await requireOwnedInvitation(supabase, userId, invitationId);
	const parsed = reorderGallerySchema.safeParse(itemIds);
	if (!parsed.success) throw new Error("Urutan galeri tidak valid.");
	const { data, error } = await supabase
		.from("gallery_items")
		.select("id")
		.eq("invitation_id", ownedId)
		.order("id", { ascending: true })
		.range(0, 9999);
	if (error) throw new Error("Gagal memeriksa galeri.");
	const currentIds = new Set((data ?? []).map(({ id }) => id));
	if (
		currentIds.size !== parsed.data.length ||
		parsed.data.some((id) => !currentIds.has(id))
	) {
		throw new Error("Galeri berubah. Muat ulang sebelum mengurutkan kembali.");
	}
	for (const [sortOrder, id] of parsed.data.entries()) {
		const { error: updateError } = await supabase
			.from("gallery_items")
			.update({ sort_order: sortOrder })
			.eq("id", id)
			.eq("invitation_id", ownedId)
			.select("id")
			.maybeSingle();
		if (updateError) throw new Error("Gagal menyimpan urutan galeri.");
	}
}
