import { getAdminTiers } from "../../../../actions/admin/tiers";
import { AdminTierManager } from "../../../../features/admin/tier-manager";

export default async function AdminTiersPage() {
	const tiers = await getAdminTiers();
	return (
		<main className="mx-auto max-w-5xl px-6 py-10">
			<h1 className="mb-6 text-3xl font-bold">Tiers</h1>
			<AdminTierManager tiers={tiers as never} />
		</main>
	);
}
