import { notFound } from "next/navigation";
import { IdentityForm } from "../../../features/invitation-builder/components/identity-form";
import { createClient } from "../../../lib/supabase/server";
import { invitationSlugSchema } from "../../../validations/invitation";

type CreatePageProps = {
	params: Promise<{ themeSlug: string }>;
};

export default async function CreatePage({ params }: CreatePageProps) {
	const { themeSlug } = await params;
	const parsedThemeSlug = invitationSlugSchema.safeParse(themeSlug);

	if (!parsedThemeSlug.success) {
		notFound();
	}

	const supabase = await createClient();
	const { data: theme, error } = await supabase
		.from("themes")
		.select("slug")
		.eq("slug", parsedThemeSlug.data)
		.eq("is_active", true)
		.maybeSingle();

	if (error || !theme) {
		notFound();
	}

	return (
		<div className="max-w-2xl mx-auto py-12 px-4">
			<h1 className="text-3xl font-serif mb-2">Buat Undangan</h1>
			<p className="text-muted-foreground mb-8">
				Langkah 1: Identitas & URL Undangan (Tema: {themeSlug})
			</p>
			<IdentityForm themeSlug={theme.slug} />
		</div>
	);
}
