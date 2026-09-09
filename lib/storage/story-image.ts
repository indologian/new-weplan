export function getStoryImagePath(
	coupleId: string,
	invitationId: string,
	storyId: string,
) {
	return `${coupleId}/${invitationId}/stories/${storyId}.webp`;
}
