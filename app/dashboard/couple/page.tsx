import { logoutAction } from "@/actions/auth/actions";
import { getCoupleDashboard } from "@/actions/dashboard/dashboard";
import { CoupleDashboard } from "@/features/couple-dashboard/components/couple-dashboard";
import { requireCoupleProfile } from "@/lib/auth/authorization";

export default async function CoupleDashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ invitationId?: string | string[] }>;
}) {
	const profile = await requireCoupleProfile();
	const requestedId = (await searchParams).invitationId;
	const dashboard = await getCoupleDashboard(
		typeof requestedId === "string" ? requestedId : undefined,
	);

	return (
		<main className="mx-auto max-w-6xl px-6 py-12">
			<header className="mb-8 rounded-lg border border-border bg-card p-8 text-card-foreground">
				<p className="text-sm font-medium text-primary">Dashboard pasangan</p>
				<h1 className="mt-2 font-serif text-3xl">
					Selamat datang, {profile.fullName}
				</h1>
				<p className="mt-3 text-muted-foreground">
					Akun Anda sudah terlindungi oleh sesi Weplan.
				</p>
				<form action={logoutAction} className="mt-8">
					<button
						className="rounded-md border border-border bg-secondary px-4 py-2 text-secondary-foreground"
						type="submit"
					>
						Keluar
					</button>
				</form>
			</header>
			<CoupleDashboard dashboard={dashboard} />
		</main>
	);
}
