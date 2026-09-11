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
import {
	getInvitationPhotoDestination,
	parseInvitationPhotoType,
} from "../../lib/storage/invitation-photo";

export async function createUploadUrl(invitationId: string, type: unknown) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const photoType = parseInvitationPhotoType(type);
	const destination = getInvitationPhotoDestination(
		context.userId,
		context.invitationId,
		photoType,
	);
	const path = authorizeCanonicalAssetPath(context, destination.path);
	const signedUrl = await createAuthorizedSignedUploadUrl(context, path, {
		errorMessage: "Gagal membuat upload URL.",
		upsert: true,
	});
	return { signedUrl };
}

export async function updateInvitationPhotoPath(
	invitationId: string,
	type: unknown,
) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const photoType = parseInvitationPhotoType(type);
	const destination = getInvitationPhotoDestination(
		context.userId,
		context.invitationId,
		photoType,
	);
	const path = authorizeCanonicalAssetPath(context, destination.path);
	await requireStoredOptimizedImage(
		getInvitationAssetStorage(context.supabase),
		path,
	);

	const { error } = await context.supabase
		.from("invitations")
		.update({ [destination.column]: path })
		.eq("id", context.invitationId)
		.eq("couple_id", context.userId);

	if (error) {
		throw new Error("Gagal memperbarui path foto.");
	}
}
