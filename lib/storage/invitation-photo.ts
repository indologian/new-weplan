export const invitationPhotoTypes = ["cover", "groom", "bride"] as const;

export type InvitationPhotoType = (typeof invitationPhotoTypes)[number];

export function parseInvitationPhotoType(value: unknown): InvitationPhotoType {
	if (
		typeof value !== "string" ||
		!invitationPhotoTypes.includes(value as InvitationPhotoType)
	) {
		throw new Error("Jenis foto tidak valid.");
	}

	return value as InvitationPhotoType;
}

export function getInvitationPhotoDestination(
	userId: string,
	invitationId: string,
	type: InvitationPhotoType,
): { column: string; path: string } {
	switch (type) {
		case "cover":
			return {
				column: "cover_photo_path",
				path: `${userId}/${invitationId}/cover/cover.webp`,
			};
		case "groom":
			return {
				column: "groom_photo_path",
				path: `${userId}/${invitationId}/couple/groom.webp`,
			};
		case "bride":
			return {
				column: "bride_photo_path",
				path: `${userId}/${invitationId}/couple/bride.webp`,
			};
	}
}
