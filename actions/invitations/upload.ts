"use server";

import { requireAuthenticatedMutation } from "@/lib/auth/authorization";

type UploadType = "cover" | "groom" | "bride";

export async function createUploadUrl(invitationId: string, type: UploadType) {
	const { supabase, userId } = await requireAuthenticatedMutation();

	// Verify ownership of invitation
	const { data: invitation, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", invitationId)
		.eq("couple_id", userId)
		.single();

	if (error || !invitation) {
		throw new Error("Tidak memiliki akses ke undangan ini.");
	}

	let path = "";
	if (type === "cover") path = `${userId}/${invitationId}/cover/cover.webp`;
	else if (type === "groom")
		path = `${userId}/${invitationId}/couple/groom.webp`;
	else if (type === "bride")
		path = `${userId}/${invitationId}/couple/bride.webp`;

	// Create signed upload URL
	const { data, error: uploadError } = await supabase.storage
		.from("invitation-assets")
		.createSignedUploadUrl(path);

	if (uploadError || !data) {
		throw new Error("Gagal membuat upload URL.");
	}

	return { signedUrl: data.signedUrl, path: data.path };
}

export async function updateInvitationPhotoPath(
	invitationId: string,
	type: UploadType,
	path: string,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();

	const updateData: Record<string, string> = {};
	if (type === "cover") updateData.cover_photo_path = path;
	else if (type === "groom") updateData.groom_photo_path = path;
	else if (type === "bride") updateData.bride_photo_path = path;

	const { error } = await supabase
		.from("invitations")
		.update(updateData)
		.eq("id", invitationId)
		.eq("couple_id", userId);

	if (error) {
		throw new Error("Gagal memperbarui path foto.");
	}
}
