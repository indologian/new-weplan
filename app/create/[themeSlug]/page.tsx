import { IdentityForm } from "@/features/invitation-builder/components/identity-form";

type CreatePageProps = {
	params: Promise<{ themeSlug: string }>;
};

export default async function CreatePage({ params }: CreatePageProps) {
	const { themeSlug } = await params;

	return (
		<div className="max-w-2xl mx-auto py-12 px-4">
			<h1 className="text-3xl font-serif mb-2">Buat Undangan</h1>
			<p className="text-muted-foreground mb-8">
				Langkah 1: Identitas & URL Undangan (Tema: {themeSlug})
			</p>
			<IdentityForm themeSlug={themeSlug} />
		</div>
	);
}
