import { getAdminThemes } from "../../../../actions/admin/themes";
import { getAdminTiers } from "../../../../actions/admin/tiers";
import { AdminThemeManager } from "../../../../features/admin/theme-manager";

export default async function AdminThemesPage() {
	const [themes, tiers] = await Promise.all([
		getAdminThemes(),
		getAdminTiers(),
	]);
	return (
		<main className="mx-auto max-w-5xl px-6 py-10">
			<h1 className="mb-6 text-3xl font-bold">Themes</h1>
			<AdminThemeManager themes={themes as never} tiers={tiers as never} />
		</main>
	);
}
