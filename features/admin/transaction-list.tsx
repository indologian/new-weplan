export function AdminTransactionList({
	result,
}: {
	result: {
		rows: Record<string, unknown>[];
		count: number;
		page: number;
		pageSize: number;
	};
}) {
	return (
		<section>
			<p className="mb-4 text-sm text-muted-foreground">
				{result.count} transaksi
			</p>
			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead>
						<tr>
							<th>Order</th>
							<th>Snapshot</th>
							<th>Nominal</th>
							<th>Status</th>
							<th>Payment</th>
							<th>Dibuat</th>
						</tr>
					</thead>
					<tbody>
						{result.rows.map((row) => (
							<tr className="border-t border-border" key={String(row.id)}>
								<td>{String(row.midtrans_order_id)}</td>
								<td>
									{String(row.theme_name_snapshot)} /{" "}
									{String(row.tier_name_snapshot)}
								</td>
								<td>{String(row.price_snapshot)}</td>
								<td>{String(row.status)}</td>
								<td>{row.payment_type ? String(row.payment_type) : "—"}</td>
								<td>{String(row.created_at)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
