import { notFound } from "next/navigation";
import { getPublicInvitation } from "../../../../lib/invitations/public-invitation";
import { PublicInvitationRenderer } from "../../_components/public-invitation-renderer";

export default async function PublicInvitationPage({
	params,
}: {
	params: Promise<{ slug: string; guestToken: string }>;
}) {
	const { slug, guestToken } = await params;
	const result = await getPublicInvitation(slug, guestToken);
	if (!result) notFound();
	return (
		<PublicInvitationRenderer
			invitation={result.invitation}
			invitee={result.invitee}
			guestToken={guestToken}
		/>
	);
}
