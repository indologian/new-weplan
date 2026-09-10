export function getGalleryImagePath(
	coupleId: string,
	invitationId: string,
	galleryItemId: string,
) {
	return `${coupleId}/${invitationId}/gallery/${galleryItemId}.webp`;
}
