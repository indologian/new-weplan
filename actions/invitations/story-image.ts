"use server";

import {
	authorizeCanonicalAssetPath,
	createAuthorizedSignedUploadUrl,
	requireOwnedInvitationAssetContext,
} from "../../lib/storage/authorized-assets";
import {
	getInvitationAssetStorage,
	requireStoredOptimizedImage,
} from "../../lib/storage/image-metadata";
import { getStoryImagePath } from "../../lib/storage/story-image";
import {
	storyIdSchema,
	storyInvitationIdSchema,
} from "../../validations/story";

async function requireOwnedStory(invitationId: string, storyId: string) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const parsedInvitationId = storyInvitationIdSchema.safeParse(
		context.invitationId,
	);
	const parsedStoryId = storyIdSchema.safeParse(storyId);
	if (!parsedInvitationId.success || !parsedStoryId.success) {
		throw new Error("Cerita tidak valid.");
	}

	const { data: story, error: storyError } = await context.supabase
		.from("stories")
		.select("id")
		.eq("id", parsedStoryId.data)
		.eq("invitation_id", context.invitationId)
		.maybeSingle();
	if (storyError || !story) {
		throw new Error("Cerita tidak ditemukan pada undangan ini.");
	}

	const path = authorizeCanonicalAssetPath(
		context,
		getStoryImagePath(context.userId, context.invitationId, story.id),
	);
	return {
		...context,
		path,
		storyId: story.id,
	};
}

export async function createStoryImageUploadUrl(
	invitationId: string,
	storyId: string,
) {
	const owned = await requireOwnedStory(invitationId, storyId);
	const signedUrl = await createAuthorizedSignedUploadUrl(owned, owned.path, {
		errorMessage: "Gagal membuat upload URL cerita.",
		upsert: true,
	});
	return { signedUrl };
}

export async function persistStoryImage(invitationId: string, storyId: string) {
	const owned = await requireOwnedStory(invitationId, storyId);
	await requireStoredOptimizedImage(
		getInvitationAssetStorage(owned.supabase),
		owned.path,
	);
	const { error } = await owned.supabase
		.from("stories")
		.update({ image_path: owned.path })
		.eq("id", owned.storyId)
		.eq("invitation_id", owned.invitationId)
		.select("id")
		.maybeSingle();
	if (error) throw new Error("Gagal menyimpan gambar cerita.");
	return { imagePath: owned.path };
}
