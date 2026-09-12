import { getAdminOverview } from "@/actions/admin/overview";
import { logoutAction } from "@/actions/auth/actions";
import { requireAdminProfile } from "@/lib/auth/authorization";
import { AdminOverviewCards } from "../../../features/admin/overview-cards";

export default async function AdminDashboardPage() {
	const profile = await requireAdminProfile();
	const metrics = await getAdminOverview();

	return (
		<main className="mx-auto max-w-5xl px-6 py-12">
			<div className="rounded-lg border border-border bg-card p-8 text-card-foreground">
				<p className="text-sm font-medium text-primary">Dashboard admin</p>
				<h1 className="mt-2 font-serif text-3xl">
					Selamat datang, {profile.fullName}
				</h1>
				<p className="mt-3 text-muted-foreground">
					Ringkasan operasional dan transaksi terverifikasi.
				</p>
				<div className="mt-8">
					<AdminOverviewCards metrics={metrics} />
				</div>
				<form action={logoutAction} className="mt-8">
					<button
						className="rounded-md border border-border bg-secondary px-4 py-2 text-secondary-foreground"
						type="submit"
					>
						Keluar
					</button>
				</form>
			</div>
		</main>
	);
}
