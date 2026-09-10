export function getBuilderEditHref(themeSlug: string, invitationId: string) {
	return `/create/${themeSlug}?invitationId=${invitationId}`;
}

export function getBuilderReviewHref(invitationId: string) {
	return `/create/review/${invitationId}`;
}
