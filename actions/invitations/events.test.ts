import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuthenticatedMutation: vi.fn(),
}));

vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	createWeddingEvent,
	deleteWeddingEvent,
	getWeddingEvents,
	reorderWeddingEvents,
	setMainWeddingEvent,
	updateWeddingEvent,
} from "./events";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

type Row = Record<string, unknown>;

class FakeQuery {
	private operation: "select" | "insert" | "update" | "delete" = "select";
	private payload: Row | null = null;
	private filters: Array<[string, unknown]> = [];
	private orderBy: { column: string; ascending: boolean } | null = null;
	private rowLimit: number | null = null;

	constructor(
		private readonly database: FakeDatabase,
		private readonly table: string,
	) {}

	select() {
		return this;
	}

	insert(payload: Row) {
		this.operation = "insert";
		this.payload = payload;
		return this;
	}

	update(payload: Row) {
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

class FakeDatabase {
	invitations: Row[] = [
		{ id: invitationId, couple_id: ownerId },
		{ id: otherInvitationId, couple_id: otherOwnerId },
	];
	events: Row[] = [];
	nextId = 1;
	failNextMainWrite = false;

	client = {
		from: (table: string) => new FakeQuery(this, table),
	};

	execute(
		table: string,
		operation: "select" | "insert" | "update" | "delete",
		payload: Row | null,
		filters: Array<[string, unknown]>,
		orderBy: { column: string; ascending: boolean } | null,
		rowLimit: number | null,
	) {
		const source = table === "invitations" ? this.invitations : this.events;
		const matches = (row: Row) =>
			filters.every(([column, value]) => row[column] === value);

		if (operation === "insert") {
			const row = {
				...payload,
				id: `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`,
			};
			this.events.push(row);
			return { data: [row], error: null };
		}

		if (operation === "update") {
			if (this.failNextMainWrite && payload?.is_main_event === true) {
				this.failNextMainWrite = false;
				return { data: null, error: new Error("unique violation detail") };
			}
			const updated: Row[] = [];
			for (const row of source) {
				if (matches(row)) {
					Object.assign(row, payload);
					updated.push(row);
				}
			}
			return { data: updated, error: null };
		}

		if (operation === "delete") {
			this.events = this.events.filter((row) => !matches(row));
			return { data: [], error: null };
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

const eventInput = (overrides: Record<string, unknown> = {}) => ({
	name: "Akad",
	eventDate: "2026-12-20",
	startTime: "09:00",
	endTime: "11:00",
	untilFinished: false,
	address: "Masjid Agung",
	latitude: -6.2,
	longitude: 106.8,
	isMainEvent: false,
	sortOrder: 99,
	...overrides,
});

describe("wedding event actions", () => {
	let database: FakeDatabase;

	beforeEach(() => {
		vi.clearAllMocks();
		database = new FakeDatabase();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("requires authentication", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValue(new Error("Login"));
		await expect(getWeddingEvents(invitationId)).rejects.toThrow("Login");
	});

	it("creates multiple events with independent address and time", async () => {
		await createWeddingEvent(invitationId, eventInput());
		await createWeddingEvent(
			invitationId,
			eventInput({
				name: "Resepsi",
				startTime: "18:30",
				endTime: "21:00",
				address: "Gedung Bahagia",
			}),
		);

		const events = await getWeddingEvents(invitationId);
		expect(events).toHaveLength(2);
		expect(events.map(({ sortOrder }) => sortOrder)).toEqual([0, 1]);
		expect(events[1]).toMatchObject({
			address: "Gedung Bahagia",
			startTime: "18:30",
			endTime: "21:00",
		});
	});

	it("normalizes end time authoritatively", async () => {
		const event = await createWeddingEvent(
			invitationId,
			eventInput({ untilFinished: true, endTime: "23:00" }),
		);
		expect(event.endTime).toBeNull();
	});

	it("rejects cross-owner create", async () => {
		await expect(
			createWeddingEvent(otherInvitationId, eventInput()),
		).rejects.toThrow("Tidak memiliki akses");
		expect(database.events).toHaveLength(0);
	});

	it("rejects update and delete using an event from another invitation", async () => {
		const foreignEvent = await seedForeignEvent(database);
		await expect(
			updateWeddingEvent(invitationId, foreignEvent.id, eventInput()),
		).rejects.toThrow("Event tidak ditemukan");
		await expect(
			deleteWeddingEvent(invitationId, foreignEvent.id),
		).rejects.toThrow("Event tidak ditemukan");
	});

	it("updates and deletes an owned event", async () => {
		const event = await createWeddingEvent(invitationId, eventInput());
		const updated = await updateWeddingEvent(
			invitationId,
			event.id,
			eventInput({
				name: "Resepsi",
				address: "Gedung Bahagia",
				startTime: "18:30",
			}),
		);
		expect(updated).toMatchObject({
			name: "Resepsi",
			address: "Gedung Bahagia",
			startTime: "18:30",
		});

		await deleteWeddingEvent(invitationId, event.id);
		expect(await getWeddingEvents(invitationId)).toEqual([]);
	});

	it("reorders all invitation events into deterministic sequential order", async () => {
		const first = await createWeddingEvent(invitationId, eventInput());
		const second = await createWeddingEvent(
			invitationId,
			eventInput({ name: "Resepsi" }),
		);
		await reorderWeddingEvents(invitationId, [second.id, first.id]);

		const events = await getWeddingEvents(invitationId);
		expect(events.map(({ id, sortOrder }) => ({ id, sortOrder }))).toEqual([
			{ id: second.id, sortOrder: 0 },
			{ id: first.id, sortOrder: 1 },
		]);
	});

	it("rejects duplicate and foreign event IDs during reorder", async () => {
		const ownEvent = await createWeddingEvent(invitationId, eventInput());
		const foreignEvent = await seedForeignEvent(database);
		await expect(
			reorderWeddingEvents(invitationId, [ownEvent.id, ownEvent.id]),
		).rejects.toThrow("Urutan event tidak valid");
		await expect(
			reorderWeddingEvents(invitationId, [foreignEvent.id]),
		).rejects.toThrow("hanya boleh memuat event");
	});

	it("sets and switches the single main event", async () => {
		const first = await createWeddingEvent(invitationId, eventInput());
		const second = await createWeddingEvent(
			invitationId,
			eventInput({ name: "Resepsi" }),
		);

		await setMainWeddingEvent(invitationId, first.id);
		await setMainWeddingEvent(invitationId, second.id);
		const events = await getWeddingEvents(invitationId);
		expect(events.filter(({ isMainEvent }) => isMainEvent)).toEqual([
			expect.objectContaining({ id: second.id }),
		]);
	});

	it("rejects a foreign event when setting main", async () => {
		const foreignEvent = await seedForeignEvent(database);
		await expect(
			setMainWeddingEvent(invitationId, foreignEvent.id),
		).rejects.toThrow("Event tidak ditemukan");
	});

	it("returns a controlled error for database main-event protection", async () => {
		const event = await createWeddingEvent(invitationId, eventInput());
		database.failNextMainWrite = true;
		await expect(setMainWeddingEvent(invitationId, event.id)).rejects.toThrow(
			"Gagal menetapkan event utama.",
		);
	});
});

async function seedForeignEvent(database: FakeDatabase) {
	mocks.requireAuthenticatedMutation.mockResolvedValueOnce({
		supabase: database.client,
		userId: otherOwnerId,
	});
	return createWeddingEvent(otherInvitationId, eventInput());
}
