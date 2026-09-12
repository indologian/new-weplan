import { getAdminHomepageSections } from "../../../../actions/admin/homepage";
import { AdminHomepageVisibility } from "../../../../features/admin/homepage-visibility";

export default async function AdminHomepagePage() {
	const sections = await getAdminHomepageSections();
	return (
		<main className="mx-auto max-w-5xl px-6 py-10">
			<h1 className="mb-6 text-3xl font-bold">Homepage visibility</h1>
			<AdminHomepageVisibility sections={sections as never} />
		</main>
	);
}
