type Row = Record<string, unknown>;

class Query {
	private filters: Array<[string, unknown]> = [];
	private orderColumn: string | null = null;
	constructor(
		private database: PublicInvitationTestDatabase,
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
	order(column: string) {
		this.orderColumn = column;
		return this;
	}
	async maybeSingle() {
		return { data: this.rows()[0] ?? null, error: null };
	}
	async range(from: number, to: number) {
		return { data: this.rows().slice(from, to + 1), error: null };
	}
	private rows() {
		const rows = [...(this.database.tables[this.table] ?? [])].filter((row) =>
			this.filters.every(([key, value]) => row[key] === value),
		);
		if (this.orderColumn)
			rows.sort(
				(a, b) =>
					Number(a[this.orderColumn as string]) -
					Number(b[this.orderColumn as string]),
			);
		return rows;
	}
}

export class PublicInvitationTestDatabase {
	selects: Array<{ table: string; columns: string }> = [];
	tables: Record<string, Row[]>;
	client: { from: (table: string) => Query; storage: { from: () => object } };
	constructor(tokenHash: string, expiresAt = "2099-01-01T00:00:00.000Z") {
		const invitationId = "00000000-0000-4000-8000-000000000100";
		const ownerId = "00000000-0000-4000-8000-000000000010";
		this.tables = {
			invitation_guests: [
				{
					invitation_id: invitationId,
					name: "Tamu",
					guest_token_hash: tokenHash,
				},
			],
			invitations: [
				{
					id: invitationId,
					couple_id: ownerId,
					slug: "owner-one",
					status: "active",
					expires_at: expiresAt,
					groom_name: "Groom",
					bride_name: "Bride",
					opening_greeting: "Welcome",
					prayer_text: "Prayer",
					rsvp_enabled: true,
					wishes_enabled: true,
					cover_photo_path: null,
					groom_photo_path: null,
					bride_photo_path: null,
					music_path: null,
					themes: { renderer_key: "elegant-green" },
				},
			],
			wedding_events: [
				{
					id: "db-event",
					invitation_id: invitationId,
					name: "Main",
					event_date: "2098-01-01",
					start_time: "09:00",
					end_time: null,
					until_finished: true,
					address: "Venue",
					latitude: -6.2,
					longitude: 106.8,
					is_main_event: true,
					sort_order: 0,
				},
			],
			stories: [
				{
					id: "db-story",
					invitation_id: invitationId,
					title: "Story",
					story_date: null,
					description: "Story",
					image_path: null,
					sort_order: 0,
				},
			],
			gallery_items: [
				{
					id: "db-gallery",
					invitation_id: invitationId,
					type: "youtube",
					image_path: null,
					youtube_video_id: "abcdefghijk",
					sort_order: 0,
				},
			],
			gift_accounts: [
				{
					id: "db-gift",
					invitation_id: invitationId,
					bank_name: "Bank",
					account_number: "001",
					account_holder: "Owner",
					sort_order: 0,
				},
			],
			wishes: [
				{
					invitation_id: invitationId,
					message: "Selamat",
					created_at: "2026-01-01",
					invitation_guests: { name: "Guest" },
				},
			],
		};
		this.client = {
			from: (table) => new Query(this, table),
			storage: { from: () => ({}) },
		};
	}
}
