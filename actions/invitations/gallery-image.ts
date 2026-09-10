"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { getGalleryImagePath } from "../../lib/storage/gallery-image";
import {
	galleryInvitationIdSchema,
	galleryItemIdSchema,
} from "../../validations/gallery";
import { getGalleryActionError } from "./gallery-errors";

type Capacity = {
	max_gallery_images: number;
	current_gallery_images: number;
};

async function getCapacity(
	supabase: Awaited<
		ReturnType<typeof requireAuthenticatedMutation>
	>["supabase"],
	invitationId: string,
) {
	const { data, error } = await supabase.rpc("get_gallery_capacity", {
		p_invitation_id: invitationId,
	});
	if (error || !data?.[0]) throw getGalleryActionError(error);
	return data[0] as Capacity;
}

export async function createGalleryImageUploadUrl(invitationId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const parsedInvitationId = galleryInvitationIdSchema.safeParse(invitationId);
	if (!parsedInvitationId.success) throw new Error("Undangan tidak valid.");
	const capacity = await getCapacity(supabase, parsedInvitationId.data);
	if (
		Number(capacity.current_gallery_images) >=
		Number(capacity.max_gallery_images)
	) {
		throw new Error("Batas gambar untuk paket undangan telah tercapai.");
	}

	const galleryItemId = crypto.randomUUID();
	const path = getGalleryImagePath(
		userId,
		parsedInvitationId.data,
		galleryItemId,
	);
	const { data, error } = await supabase.storage
		.from("invitation-assets")
		.createSignedUploadUrl(path, { upsert: true });
	if (error || !data) throw new Error("Gagal membuat upload URL galeri.");
	return { galleryItemId, signedUrl: data.signedUrl };
}

export async function persistGalleryImage(
	invitationId: string,
	galleryItemId: string,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const parsedInvitationId = galleryInvitationIdSchema.safeParse(invitationId);
	const parsedItemId = galleryItemIdSchema.safeParse(galleryItemId);
	if (!parsedInvitationId.success || !parsedItemId.success) {
		throw new Error("Data gambar galeri tidak valid.");
	}
	await getCapacity(supabase, parsedInvitationId.data);
	const path = getGalleryImagePath(
		userId,
		parsedInvitationId.data,
		parsedItemId.data,
	);
	const folder = `${userId}/${parsedInvitationId.data}/gallery`;
	const filename = `${parsedItemId.data}.webp`;
	const { data: objects, error: listError } = await supabase.storage
		.from("invitation-assets")
		.list(folder, { limit: 1, search: filename });
	if (listError || !objects?.some(({ name }) => name === filename)) {
		throw new Error("Gambar galeri belum berhasil diunggah.");
	}

	const { data, error } = await supabase.rpc("create_gallery_item_atomic", {
		p_invitation_id: parsedInvitationId.data,
		p_gallery_item_id: parsedItemId.data,
		p_media_type: "image",
		p_youtube_video_id: null,
	});
	if (!error && data?.[0]) return data[0];

	const { data: committedItem } = await supabase
		.from("gallery_items")
		.select("id,type,image_path,youtube_video_id,sort_order")
		.eq("id", parsedItemId.data)
		.eq("invitation_id", parsedInvitationId.data)
		.maybeSingle();
	if (committedItem) return committedItem;

	await supabase.storage.from("invitation-assets").remove([path]);
	throw getGalleryActionError(error);
}
