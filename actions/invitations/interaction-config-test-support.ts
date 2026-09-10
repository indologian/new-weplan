type InteractionRow = Record<string, unknown>;

class InteractionQuery {
	private operation: "select" | "update" = "select";
	private payload: InteractionRow = {};
	private filters: Array<[string, unknown]> = [];

	constructor(private readonly database: InteractionConfigTestDatabase) {}

	select() {
		return this;
	}
	update(payload: InteractionRow) {
		this.operation = "update";
		this.payload = payload;
		return this;
	}
	eq(column: string, value: unknown) {
		this.filters.push([column, value]);
		return this;
	}
	async maybeSingle() {
		const result = this.execute();
		return { data: result.data[0] ?? null, error: null };
	}
	async single() {
		const result = this.execute();
		return { data: result.data[0] ?? null, error: null };
	}

	private execute() {
		const matches = (row: InteractionRow) =>
			this.filters.every(([key, value]) => row[key] === value);
		const data = this.database.invitations.filter(matches);
		if (this.operation === "update") {
			this.database.updatePayloads.push({ ...this.payload });
			for (const row of data) Object.assign(row, this.payload);
		}
		return { data };
	}
}

export class InteractionConfigTestDatabase {
	invitations: InteractionRow[];
	updatePayloads: InteractionRow[] = [];

	constructor(
		ownerId: string,
		invitationId: string,
		otherOwnerId: string,
		otherInvitationId: string,
	) {
		this.invitations = [
			{
				id: invitationId,
				couple_id: ownerId,
				rsvp_enabled: true,
				wishes_enabled: true,
				status: "draft",
				slug: "owner-invitation",
			},
			{
				id: otherInvitationId,
				couple_id: otherOwnerId,
				rsvp_enabled: false,
				wishes_enabled: false,
				status: "draft",
				slug: "foreign-invitation",
			},
		];
	}

	client = {
		from: () => new InteractionQuery(this),
	};
}
