export type GiftTestRow = Record<string, unknown>;

class GiftTestQuery {
	private operation: "select" | "insert" | "update" | "delete" = "select";
	private payload: GiftTestRow | null = null;
	private filters: Array<[string, unknown]> = [];
	private orderBy: { column: string; ascending: boolean } | null = null;
	private rowLimit: number | null = null;

	constructor(
		private readonly database: GiftTestDatabase,
		private readonly table: string,
	) {}

	select() {
		return this;
	}
	insert(payload: GiftTestRow) {
		this.operation = "insert";
		this.payload = payload;
		return this;
	}
	update(payload: GiftTestRow) {
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
	limit(limit: number) {
		this.rowLimit = limit;
		return this;
	}
	async range(from: number, to: number) {
		this.rowLimit = to - from + 1;
		const result = this.execute();
		return { ...result, data: result.data?.slice(from) ?? null };
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
			this.rowLimit,
		);
	}
}

export class GiftTestDatabase {
	invitations: GiftTestRow[];
	accounts: GiftTestRow[] = [];
	private nextId = 1;

	constructor(
		ownerId: string,
		invitationId: string,
		otherOwnerId: string,
		otherInvitationId: string,
	) {
		this.invitations = [
			{ id: invitationId, couple_id: ownerId },
			{ id: otherInvitationId, couple_id: otherOwnerId },
		];
	}

	client = {
		from: (table: string) => new GiftTestQuery(this, table),
	};

	execute(
		table: string,
		operation: "select" | "insert" | "update" | "delete",
		payload: GiftTestRow | null,
		filters: Array<[string, unknown]>,
		orderBy: { column: string; ascending: boolean } | null,
		rowLimit: number | null,
	) {
		const source = table === "invitations" ? this.invitations : this.accounts;
		const matches = (row: GiftTestRow) =>
			filters.every(([column, value]) => row[column] === value);

		if (operation === "insert") {
			const row = {
				...payload,
				id: `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`,
			};
			this.accounts.push(row);
			return { data: [row], error: null };
		}
		if (operation === "update") {
			const updated = source.filter(matches);
			for (const row of updated) Object.assign(row, payload);
			return { data: updated, error: null };
		}
		if (operation === "delete") {
			const deleted = this.accounts.filter(matches);
			this.accounts = this.accounts.filter((row) => !matches(row));
			return { data: deleted, error: null };
		}

		let rows = source.filter(matches);
		if (orderBy) {
			const direction = orderBy.ascending ? 1 : -1;
			rows = [...rows].sort(
				(left, right) =>
					(Number(left[orderBy.column]) - Number(right[orderBy.column])) *
					direction,
			);
		}
		if (rowLimit !== null) rows = rows.slice(0, rowLimit);
		return { data: rows, error: null };
	}
}
