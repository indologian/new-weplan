import { notFound } from "next/navigation";
import { getThemeBySlug } from "../../../../themes/catalog";
import { mockInvitation, mockInvitee } from "../../../../themes/fixtures";
import { getThemeRenderer } from "../../../../themes/registry";

export default async function ThemePreviewPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const theme = getThemeBySlug(slug);
	if (!theme) {
		notFound();
	}

	const ThemeComponent = getThemeRenderer(theme.rendererKey);

	if (!ThemeComponent) {
		notFound();
	}

	const invitation = {
		...mockInvitation,
		theme: { rendererKey: theme.rendererKey },
	};

	return <ThemeComponent invitation={invitation} invitee={mockInvitee} />;
}
