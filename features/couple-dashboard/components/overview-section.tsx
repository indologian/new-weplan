import type { RsvpSummary } from "../../../actions/dashboard/dashboard";

export function OverviewSection({
	totalInvitations,
	statusCounts,
	rsvp,
	wishes,
}: {
	totalInvitations: number;
	statusCounts: {
		draft: number;
		paymentPending: number;
		active: number;
		expired: number;
	};
	rsvp: RsvpSummary;
	wishes: number;
}) {
	const metrics = [
		["Undangan", totalInvitations],
		["Draft", statusCounts.draft],
		["Menunggu pembayaran", statusCounts.paymentPending],
		["Aktif", statusCounts.active],
		["Kedaluwarsa", statusCounts.expired],
		["Tamu", rsvp.totalGuests],
		["Tamu hadir", rsvp.totalAttendingGuestCount],
		["Ucapan", wishes],
	] as const;
	return (
		<section id="overview" aria-labelledby="overview-title">
			<h2 id="overview-title" className="font-serif text-2xl">
				Overview
			</h2>
			<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{metrics.map(([label, value]) => (
					<div
						key={label}
						className="rounded-lg border border-border bg-card p-4"
					>
						<p className="text-sm text-muted-foreground">{label}</p>
						<p className="mt-1 text-2xl font-bold">{value}</p>
					</div>
				))}
			</div>
		</section>
	);
}
