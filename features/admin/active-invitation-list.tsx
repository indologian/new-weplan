export function AdminActiveInvitationList({
	result,
}: {
	result: { rows: Record<string, unknown>[]; count: number };
}) {
	return (
		<section>
			<p className="mb-4 text-sm text-muted-foreground">
				{result.count} undangan aktif
			</p>
			<ul className="space-y-3">
				{result.rows.map((row) => (
					<li
						className="rounded-lg border border-border p-4"
						key={String(row.id)}
					>
						<p className="font-medium">/{String(row.slug)}</p>
						<p className="text-sm text-muted-foreground">
							Paid: {String(row.paid_at)} · Expires: {String(row.expires_at)}
						</p>
					</li>
				))}
			</ul>
		</section>
	);
}
