export type InviteeTestRow = Record<string, unknown>;

class Query {
	private operation: "select" | "upsert" = "select";
	private payload: InviteeTestRow | null = null;
	private conflict: string | null = null;
	private filters: Array<[string, unknown]> = [];
	private orders: Array<{ column: string; ascending: boolean }> = [];

	constructor(
		private database: InviteeTestDatabase,
		private table: string,
	) {}
	select(columns: string) {
		this.database.selects.push({ table: this.table, columns });
		return this;
	}
	eq(column: string, value: unknown) {
		this.filters.push([column, value]);
		return this;
	}
	order(column: string, options: { ascending: boolean }) {
		this.orders.push({ column, ascending: options.ascending });
		return this;
	}
	upsert(payload: InviteeTestRow, options: { onConflict: string }) {
		this.operation = "upsert";
		this.payload = payload;
		this.conflict = options.onConflict;
		this.database.upserts.push({ table: this.table, payload, ...options });
		return this;
	}
	async maybeSingle() {
		const result = this.execute();
		return { data: result.data[0] ?? null, error: result.error };
	}
	async range(from: number, to: number) {
		const result = this.execute();
		return { data: result.data.slice(from, to + 1), error: result.error };
	}
	private execute() {
		if (this.operation === "upsert" && this.payload) {
			const rows = this.database.tables[this.table] ?? [];
			const conflictValue = this.payload[this.conflict as string];
			const existing = rows.find(
				(row) => row[this.conflict as string] === conflictValue,
			);
			if (existing) Object.assign(existing, this.payload);
			else {
				rows.push({
					id: `row-${rows.length + 1}`,
					created_at: "2026-01-01T00:00:00.000Z",
					...this.payload,
				});
			}
			this.database.tables[this.table] = rows;
			this.operation = "select";
		}
		const data = [...(this.database.tables[this.table] ?? [])].filter((row) =>
			this.filters.every(([column, value]) => row[column] === value),
		);
		for (const order of [...this.orders].reverse()) {
			data.sort((left, right) => {
				const result = String(left[order.column]).localeCompare(
					String(right[order.column]),
				);
				return order.ascending ? result : -result;
			});
		}
		return { data, error: null };
	}
}

export class InviteeTestDatabase {
	selects: Array<{ table: string; columns: string }> = [];
	upserts: Array<{
		table: string;
		payload: InviteeTestRow;
		onConflict: string;
	}> = [];
	tables: Record<string, InviteeTestRow[]>;
	client: { from: (table: string) => Query };

	constructor(tokenHash: string, expiresAt = "2099-01-01T00:00:00.000Z") {
		const invitationId = "00000000-0000-4000-8000-000000000100";
		const guestId = "00000000-0000-4000-8000-000000000200";
		this.tables = {
			invitation_guests: [
				{
					id: guestId,
					invitation_id: invitationId,
					name: "Tamu A",
					guest_token_hash: tokenHash,
					guest_token_encrypted: "must-not-be-read",
				},
			],
			invitations: [
				{
					id: invitationId,
					slug: "owner-one",
					status: "active",
					expires_at: expiresAt,
					delete_after: "2100-01-01T00:00:00.000Z",
					rsvp_enabled: true,
					wishes_enabled: true,
				},
			],
			rsvps: [],
			wishes: [],
		};
		this.client = { from: (table) => new Query(this, table) };
	}
}
