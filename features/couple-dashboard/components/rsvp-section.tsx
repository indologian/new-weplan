import type {
	DashboardRsvp,
	RsvpSummary,
} from "../../../actions/dashboard/dashboard";

export function RsvpSection({
	summary,
	rows,
}: {
	summary: RsvpSummary;
	rows: DashboardRsvp[];
}) {
	return (
		<section id="rsvp" aria-labelledby="rsvp-title">
			<h2 id="rsvp-title" className="font-serif text-2xl">
				RSVP
			</h2>
			<div className="mt-4 grid gap-3 sm:grid-cols-3">
				<p className="rounded-lg border border-border bg-card p-4">
					Hadir: <strong>{summary.attending}</strong>
				</p>
				<p className="rounded-lg border border-border bg-card p-4">
					Tidak hadir: <strong>{summary.notAttending}</strong>
				</p>
				<p className="rounded-lg border border-border bg-card p-4">
					Belum merespons: <strong>{summary.notResponded}</strong>
				</p>
			</div>
			<p className="mt-3 text-sm text-muted-foreground">
				Total orang hadir: {summary.totalAttendingGuestCount}
			</p>
			<ul className="mt-4 space-y-2">
				{rows.map((row) => (
					<li key={row.id} className="rounded border border-border p-3">
						{row.guestName}:{" "}
						{row.attendance === "attending"
							? `hadir (${row.guestCount})`
							: "tidak hadir"}
					</li>
				))}
			</ul>
		</section>
	);
}
