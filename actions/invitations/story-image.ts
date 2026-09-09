"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { getStoryImagePath } from "../../lib/storage/story-image";
import {
	storyIdSchema,
	storyInvitationIdSchema,
} from "../../validations/story";

async function requireOwnedStory(invitationId: string, storyId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const parsedInvitationId = storyInvitationIdSchema.safeParse(invitationId);
	const parsedStoryId = storyIdSchema.safeParse(storyId);
	if (!parsedInvitationId.success || !parsedStoryId.success) {
		throw new Error("Cerita tidak valid.");
	}

	const { data: invitation, error: invitationError } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsedInvitationId.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (invitationError || !invitation) {
		throw new Error("Tidak memiliki akses ke undangan ini.");
	}

	const { data: story, error: storyError } = await supabase
		.from("stories")
		.select("id")
		.eq("id", parsedStoryId.data)
		.eq("invitation_id", invitation.id)
		.maybeSingle();
	if (storyError || !story) {
		throw new Error("Cerita tidak ditemukan pada undangan ini.");
	}

	return {
		supabase,
		path: getStoryImagePath(userId, invitation.id, story.id),
		invitationId: invitation.id,
		storyId: story.id,
	};
}

export async function createStoryImageUploadUrl(
	invitationId: string,
	storyId: string,
) {
	const owned = await requireOwnedStory(invitationId, storyId);
	const { data, error } = await owned.supabase.storage
		.from("invitation-assets")
		.createSignedUploadUrl(owned.path, { upsert: true });
	if (error || !data) throw new Error("Gagal membuat upload URL cerita.");
	return { signedUrl: data.signedUrl };
}

export async function persistStoryImage(invitationId: string, storyId: string) {
	const owned = await requireOwnedStory(invitationId, storyId);
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
