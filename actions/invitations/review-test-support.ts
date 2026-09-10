type Row = Record<string, unknown>;

class ReviewQuery {
	private filters: Array<[string, unknown]> = [];
	private orderColumn: string | null = null;

	constructor(
		private readonly database: ReviewTestDatabase,
		private readonly table: string,
	) {}
	select() {
		return this;
	}
	eq(column: string, value: unknown) {
		this.filters.push([column, value]);
		return this;
	}
	order(column: string) {
		this.orderColumn = column;
		return this;
	}
	async maybeSingle() {
		const rows = this.rows();
		return { data: rows[0] ?? null, error: null };
	}
	async range(from: number, to: number) {
		return { data: this.rows().slice(from, to + 1), error: null };
	}
	private rows() {
		let rows = [...(this.database.tables[this.table] ?? [])].filter((row) =>
			this.filters.every(([column, value]) => row[column] === value),
		);
		if (this.orderColumn) {
			const column = this.orderColumn;
			rows = rows.sort(
				(left, right) => Number(left[column]) - Number(right[column]),
			);
		}
		return rows;
	}
}

export class ReviewTestDatabase {
	fromTables: string[] = [];
	signedBatches: Array<{ paths: string[]; expiresIn: number }> = [];
	tables: Record<string, Row[]>;

	constructor(ownerId: string, invitationId: string, otherOwnerId: string) {
		this.tables = {
			invitations: [
				{
					id: invitationId,
					couple_id: ownerId,
					slug: "persisted-couple",
					groom_name: "Groom",
					groom_father_name: "Father",
					groom_mother_name: "Mother",
					groom_photo_path: null,
					bride_name: "Bride",
					bride_father_name: null,
					bride_mother_name: null,
					bride_photo_path: null,
					cover_photo_path: `${ownerId}/${invitationId}/cover/cover.webp`,
					music_path: null,
					opening_greeting: "Persisted greeting",
					prayer_text: "Persisted prayer",
					rsvp_enabled: true,
					wishes_enabled: false,
					status: "draft",
					themes: {
						name: "Elegant Green",
						slug: "elegant-green",
						renderer_key: "elegant-green",
						tiers: {
							code: "premium",
							name: "Premium",
							price: 250000,
							active_months: 12,
						},
					},
				},
				{
					id: "00000000-0000-4000-8000-000000000200",
					couple_id: otherOwnerId,
					slug: "foreign",
					themes: {
						name: "Elegant Green",
						slug: "elegant-green",
						renderer_key: "elegant-green",
						tiers: { code: "basic", name: "Basic", price: 0, active_months: 3 },
					},
				},
			],
			wedding_events: [
				{
					id: "event-later",
					invitation_id: invitationId,
					name: "Reception",
					event_date: "2027-02-01",
					start_time: "11:00",
					end_time: "13:00",
					until_finished: false,
					address: "Venue",
					latitude: null,
					longitude: null,
					is_main_event: false,
					sort_order: 1,
				},
				{
					id: "event-main",
					invitation_id: invitationId,
					name: "Ceremony",
					event_date: "2027-02-01",
					start_time: "09:00",
					end_time: null,
					until_finished: true,
					address: "Venue",
					latitude: null,
					longitude: null,
					is_main_event: true,
					sort_order: 0,
				},
			],
			stories: [],
			gallery_items: [],
			gift_accounts: [],
		};
	}

	client = {
		from: (table: string) => {
			this.fromTables.push(table);
			return new ReviewQuery(this, table);
		},
		storage: {
			from: () => ({
				createSignedUrls: async (paths: string[], expiresIn: number) => {
					this.signedBatches.push({ paths, expiresIn });
					return {
						data: paths.map((path) => ({
							path,
							signedUrl: `https://signed.test/${encodeURIComponent(path)}`,
						})),
						error: null,
					};
				},
			}),
		},
	};
}
