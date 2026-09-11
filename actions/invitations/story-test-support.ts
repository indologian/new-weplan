import { vi } from "vitest";

export type TestRow = Record<string, unknown>;

class FakeQuery {
	private operation: "select" | "insert" | "update" | "delete" = "select";
	private payload: TestRow | null = null;
	private filters: Array<[string, unknown]> = [];
	private orderBy: { column: string; ascending: boolean } | null = null;
	private rowLimit: number | null = null;

	constructor(
		private readonly database: StoryTestDatabase,
		private readonly table: string,
	) {}

	select() {
		return this;
	}
	insert(payload: TestRow) {
		this.operation = "insert";
		this.payload = payload;
		return this;
	}
	update(payload: TestRow) {
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

export class StoryTestDatabase {
	invitations: TestRow[];
	stories: TestRow[] = [];
	nextId = 1;
	removedPaths: string[][] = [];
	signedPaths: string[] = [];

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
		from: (table: string) => new FakeQuery(this, table),
		storage: {
			from: vi.fn(() => ({
				info: vi.fn(async () => ({
					data: { size: 100, contentType: "image/webp" },
					error: null,
				})),
				createSignedUploadUrl: vi.fn(async (path: string) => {
					this.signedPaths.push(path);
					return {
						data: { signedUrl: "https://storage.test/signed" },
						error: null,
					};
				}),
				remove: vi.fn(async (paths: string[]) => {
					this.removedPaths.push(paths);
					return { data: [], error: null };
				}),
			})),
		},
	};

	execute(
		table: string,
		operation: "select" | "insert" | "update" | "delete",
		payload: TestRow | null,
		filters: Array<[string, unknown]>,
		orderBy: { column: string; ascending: boolean } | null,
		rowLimit: number | null,
	) {
		const source = table === "invitations" ? this.invitations : this.stories;
		const matches = (row: TestRow) =>
			filters.every(([column, value]) => row[column] === value);

		if (operation === "insert") {
			const row = {
				...payload,
				id: `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`,
			};
			this.stories.push(row);
			return { data: [row], error: null };
		}
		if (operation === "update") {
			const updated: TestRow[] = [];
			for (const row of source) {
				if (matches(row)) {
					Object.assign(row, payload);
					updated.push(row);
				}
			}
			return { data: updated, error: null };
		}
		if (operation === "delete") {
			this.stories = this.stories.filter((row) => !matches(row));
			return { data: [], error: null };
		}

		let rows = source.filter(matches);
		if (orderBy) {
			const direction = orderBy.ascending ? 1 : -1;
			rows = [...rows].sort(
				(left, right) =>
					(String(left[orderBy.column]) > String(right[orderBy.column])
						? 1
						: -1) * direction,
			);
		}
		if (rowLimit !== null) rows = rows.slice(0, rowLimit);
		return { data: rows, error: null };
	}
}
