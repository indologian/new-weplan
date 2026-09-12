import type { getAdminOverview } from "../../actions/admin/overview";

type Metrics = Awaited<ReturnType<typeof getAdminOverview>>;
export function AdminOverviewCards({ metrics }: { metrics: Metrics }) {
	const revenue = new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(BigInt(metrics.totalPaidRevenue));
	const cards = [
		["Revenue paid", revenue],
		["Paid", metrics.paidTransactionCount],
		["Pending", metrics.pendingTransactionCount],
		["Failed/expired/cancelled", metrics.terminalTransactionCount],
		["Active invitations", metrics.activeInvitationCount],
	];
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{cards.map(([label, value]) => (
				<section
					className="rounded-lg border border-border bg-card p-5"
					key={label}
				>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="mt-2 text-2xl font-semibold">{value}</p>
				</section>
			))}
		</div>
	);
}
