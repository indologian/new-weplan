import { notFound } from "next/navigation";
import { mockInvitation, mockInvitee } from "../../../../themes/fixtures";
import { getThemeRenderer } from "../../../../themes/registry";

export default async function ThemePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Resolve slug to InvitationViewModel (using mock data for Task 04)
  const invitation = slug === mockInvitation.slug ? mockInvitation : null;

  if (!invitation) {
    notFound();
  }

  // 2. Resolve renderer_key to ThemeComponent
  const rendererKey = invitation.theme.rendererKey;
  const ThemeComponent = getThemeRenderer(rendererKey);

  if (!ThemeComponent) {
    console.error(`Theme renderer not found for key: ${rendererKey}`);
    notFound();
  }

  // 3. Render theme
  return <ThemeComponent invitation={invitation} invitee={mockInvitee} />;
}
