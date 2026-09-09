"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	getInvitationPhotoDestination,
	parseInvitationPhotoType,
} from "../../lib/storage/invitation-photo";

async function requireOwnedInvitation(
	invitationId: string,
	supabase: Awaited<
		ReturnType<typeof requireAuthenticatedMutation>
	>["supabase"],
	userId: string,
) {
	const { data: invitation, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", invitationId)
		.eq("couple_id", userId)
		.maybeSingle();

	if (error || !invitation) {
		throw new Error("Tidak memiliki akses ke undangan ini.");
	}
}

export async function createUploadUrl(invitationId: string, type: unknown) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	await requireOwnedInvitation(invitationId, supabase, userId);
	const photoType = parseInvitationPhotoType(type);
	const { path } = getInvitationPhotoDestination(
		userId,
		invitationId,
		photoType,
	);

	// Create signed upload URL
	const { data, error: uploadError } = await supabase.storage
		.from("invitation-assets")
		.createSignedUploadUrl(path);

	if (uploadError || !data) {
		throw new Error("Gagal membuat upload URL.");
	}

	return { signedUrl: data.signedUrl };
}

export async function updateInvitationPhotoPath(
	invitationId: string,
	type: unknown,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	await requireOwnedInvitation(invitationId, supabase, userId);
	const photoType = parseInvitationPhotoType(type);
	const { column, path } = getInvitationPhotoDestination(
		userId,
		invitationId,
		photoType,
	);

	const { error } = await supabase
		.from("invitations")
		.update({ [column]: path })
		.eq("id", invitationId)
		.eq("couple_id", userId);

	if (error) {
		throw new Error("Gagal memperbarui path foto.");
	}
}
