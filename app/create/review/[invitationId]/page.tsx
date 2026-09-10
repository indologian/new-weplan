import { notFound } from "next/navigation";
import { getOwnedInvitationReview } from "../../../../actions/invitations/review";
import { ReviewSummary } from "../../../../features/invitation-builder/components/review-summary";
import { getThemeRenderer } from "../../../../themes/registry";

export default async function ReviewPage({
	params,
}: {
	params: Promise<{ invitationId: string }>;
}) {
	const { invitationId } = await params;
	const review = await getOwnedInvitationReview(invitationId);
	if (!getThemeRenderer(review.rendererKey)) notFound();
	return <ReviewSummary review={review} />;
}
