"use server";

import type { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	authorizeCanonicalAssetPath,
	createAuthorizedSignedUploadUrl,
	requireOwnedInvitationAssetContext,
} from "../../lib/storage/authorized-assets";
import { cleanupAuthorizedAssets } from "../../lib/storage/cleanup";
import { getGalleryImagePath } from "../../lib/storage/gallery-image";
import {
	getInvitationAssetStorage,
	requireStoredOptimizedImage,
} from "../../lib/storage/image-metadata";
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
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const capacity = await getCapacity(context.supabase, context.invitationId);
	if (
		Number(capacity.current_gallery_images) >=
		Number(capacity.max_gallery_images)
	) {
		throw new Error("Batas gambar untuk paket undangan telah tercapai.");
	}

	const galleryItemId = crypto.randomUUID();
	const path = authorizeCanonicalAssetPath(
		context,
		getGalleryImagePath(context.userId, context.invitationId, galleryItemId),
	);
	const signedUrl = await createAuthorizedSignedUploadUrl(context, path, {
		errorMessage: "Gagal membuat upload URL galeri.",
		upsert: true,
	});
	return { galleryItemId, signedUrl };
}

export async function persistGalleryImage(
	invitationId: string,
	galleryItemId: string,
) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const { supabase, userId } = context;
	const parsedInvitationId = galleryInvitationIdSchema.safeParse(invitationId);
	const parsedItemId = galleryItemIdSchema.safeParse(galleryItemId);
	if (!parsedInvitationId.success || !parsedItemId.success) {
		throw new Error("Data gambar galeri tidak valid.");
	}
	await getCapacity(supabase, context.invitationId);
	const path = authorizeCanonicalAssetPath(
		context,
		getGalleryImagePath(userId, context.invitationId, parsedItemId.data),
	);
	const storage = getInvitationAssetStorage(supabase);
	await requireStoredOptimizedImage(storage, path);

	const { data, error } = await supabase.rpc("create_gallery_item_atomic", {
		p_invitation_id: context.invitationId,
		p_gallery_item_id: parsedItemId.data,
		p_media_type: "image",
		p_youtube_video_id: null,
	});
	if (!error && data?.[0]) return data[0];

	const { data: committedItem } = await supabase
		.from("gallery_items")
		.select("id,type,image_path,youtube_video_id,sort_order")
		.eq("id", parsedItemId.data)
		.eq("invitation_id", context.invitationId)
		.maybeSingle();
	if (committedItem) return committedItem;

	const cleanup = await cleanupAuthorizedAssets(storage, [path]);
	const actionError = getGalleryActionError(error);
	if (cleanup.outcome === "partial-failure") {
		throw new Error(`${actionError.message} Gambar orphan gagal dibersihkan.`);
	}
	throw actionError;
}
