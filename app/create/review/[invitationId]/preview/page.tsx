import { notFound } from "next/navigation";
import { getOwnedInvitationReview } from "../../../../../actions/invitations/review";
import { PrivatePreview } from "../../../../../features/invitation-builder/components/private-preview";
import { getThemeRenderer } from "../../../../../themes/registry";

export default async function PreviewPage({
	params,
}: {
	params: Promise<{ invitationId: string }>;
}) {
	const { invitationId } = await params;
	const review = await getOwnedInvitationReview(invitationId);
	if (!getThemeRenderer(review.rendererKey)) notFound();
	return (
		<PrivatePreview
			invitation={review.viewModel}
			themeSlug={review.themeSlug}
		/>
	);
}
