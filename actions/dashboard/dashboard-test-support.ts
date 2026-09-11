export type DashboardTestRow = Record<string, unknown>;

class DashboardTestQuery {
	private operation: "select" | "insert" | "update" | "delete" = "select";
	private payload: DashboardTestRow | null = null;
	private filters: Array<[string, unknown]> = [];
	private orderBy: { column: string; ascending: boolean } | null = null;

	constructor(
		private database: DashboardTestDatabase,
		private table: string,
	) {}
	select() {
		return this;
	}
	insert(payload: DashboardTestRow) {
		this.operation = "insert";
		this.payload = payload;
		return this;
	}
	update(payload: DashboardTestRow) {
		this.operation = "update";
		this.payload = payload;
		return this;
	}
	delete() {
		this.operation = "delete";
		return this;
	}
	eq(column: string, value: unknown) {
		this.filters.push([column, value]);
		return this;
	}
	order(column: string, options: { ascending: boolean }) {
		this.orderBy = { column, ascending: options.ascending };
		return this;
	}
	async range(from: number, to: number) {
		const result = this.execute();
		return { ...result, data: result.data?.slice(from, to + 1) ?? null };
	}
	async maybeSingle() {
		const result = this.execute();
		return { data: result.data?.[0] ?? null, error: result.error };
	}
	async single() {
		const result = this.execute();
		return { data: result.data?.[0] ?? null, error: result.error };
	}
	private execute() {
		return this.database.execute(
			this.table,
			this.operation,
			this.payload,
			this.filters,
			this.orderBy,
		);
	}
}

export class DashboardTestDatabase {
	tables: Record<string, DashboardTestRow[]>;
	mutationTables: string[] = [];
	updatePayloads: DashboardTestRow[] = [];
	insertErrors: Array<{ code: string; message: string }> = [];
	updateErrors: Array<{ code: string; message: string }> = [];
	private nextGuest = 1;

	constructor(
		ownerId: string,
		invitationId: string,
		otherOwnerId: string,
		otherInvitationId: string,
	) {
		this.tables = {
			invitations: [
				{
					id: invitationId,
					couple_id: ownerId,
					slug: "owner-one",
					status: "draft",
					rsvp_enabled: true,
					wishes_enabled: true,
					created_at: "2026-01-01",
					themes: { slug: "elegant-green" },
				},
				{
					id: "00000000-0000-4000-8000-000000000101",
					couple_id: ownerId,
					slug: "owner-two",
					status: "active",
					rsvp_enabled: true,
					wishes_enabled: false,
					created_at: "2026-02-01",
					themes: { slug: "elegant-green" },
				},
				{
					id: otherInvitationId,
					couple_id: otherOwnerId,
					slug: "foreign",
					status: "expired",
					rsvp_enabled: true,
					wishes_enabled: true,
					created_at: "2026-03-01",
					themes: { slug: "elegant-green" },
				},
			],
			invitation_guests: [
				{
					id: "00000000-0000-4000-8000-000000000301",
					invitation_id: invitationId,
					name: "A",
					guest_token_hash: "old-hash",
					guest_token_encrypted: "encrypted",
					created_at: "2026-01-01",
				},
				{
					id: "00000000-0000-4000-8000-000000000302",
					invitation_id: invitationId,
					name: "B",
					guest_token_hash: "old-hash-2",
					guest_token_encrypted: "encrypted-2",
					created_at: "2026-01-02",
				},
				{
					id: "00000000-0000-4000-8000-000000000399",
					invitation_id: otherInvitationId,
					name: "Foreign",
					guest_token_hash: "foreign",
					guest_token_encrypted: "foreign",
					created_at: "2026-01-01",
				},
			],
			rsvps: [
				{
					id: "00000000-0000-4000-8000-000000000401",
					invitation_id: invitationId,
					guest_id: "00000000-0000-4000-8000-000000000301",
					attendance: "attending",
					guest_count: 3,
				},
				{
					id: "00000000-0000-4000-8000-000000000499",
					invitation_id: otherInvitationId,
					guest_id: "00000000-0000-4000-8000-000000000399",
					attendance: "attending",
					guest_count: 99,
				},
			],
			wishes: [
				{
					id: "00000000-0000-4000-8000-000000000501",
					invitation_id: invitationId,
					guest_id: "00000000-0000-4000-8000-000000000301",
					message: "Selamat",
					created_at: "2026-01-02",
				},
				{
					id: "00000000-0000-4000-8000-000000000599",
					invitation_id: otherInvitationId,
					guest_id: "00000000-0000-4000-8000-000000000399",
					message: "Foreign",
					created_at: "2026-01-03",
				},
			],
		};
	}

	client = { from: (table: string) => new DashboardTestQuery(this, table) };

	execute(
		table: string,
		operation: "select" | "insert" | "update" | "delete",
		payload: DashboardTestRow | null,
		filters: Array<[string, unknown]>,
		orderBy: { column: string; ascending: boolean } | null,
	) {
		const rows = this.tables[table] ?? [];
		const matches = (row: DashboardTestRow) =>
			filters.every(([column, value]) => row[column] === value);
		if (operation === "insert") {
			this.mutationTables.push(table);
			const forcedError = this.insertErrors.shift();
			if (forcedError) return { data: null, error: forcedError };
			const row = {
				...payload,
				id: `00000000-0000-4000-8001-${String(this.nextGuest++).padStart(12, "0")}`,
				created_at: "2026-04-01",
			};
			rows.push(row);
			this.tables[table] = rows;
			return { data: [row], error: null };
		}
		if (operation === "update") {
			this.mutationTables.push(table);
			this.updatePayloads.push({ ...payload });
			const forcedError = this.updateErrors.shift();
			if (forcedError) return { data: null, error: forcedError };
			const updated = rows.filter(matches);
			for (const row of updated) Object.assign(row, payload);
			return { data: updated, error: null };
		}
		if (operation === "delete") {
			this.mutationTables.push(table);
			const deleted = rows.filter(matches);
			this.tables[table] = rows.filter((row) => !matches(row));
			return { data: deleted, error: null };
		}
		let selected = rows.filter(matches);
		if (orderBy) {
			const direction = orderBy.ascending ? 1 : -1;
			selected = [...selected].sort(
				(a, b) =>
					String(a[orderBy.column]).localeCompare(String(b[orderBy.column])) *
					direction,
			);
		}
		return { data: selected, error: null };
	}
}
