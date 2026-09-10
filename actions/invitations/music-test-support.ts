type Row = Record<string, unknown>;

class MusicQuery {
	private operation: "select" | "update" = "select";
	private payload: Row = {};
	private filters: Array<[string, unknown]> = [];

	constructor(private readonly database: MusicTestDatabase) {}
	select() {
		return this;
	}
	update(payload: Row) {
		this.operation = "update";
		this.payload = payload;
		return this;
	}
	eq(column: string, value: unknown) {
		this.filters.push([column, value]);
		return this;
	}
	async maybeSingle() {
		const rows = this.database.invitations.filter((row) =>
			this.filters.every(([column, value]) => row[column] === value),
		);
		if (this.operation === "update") {
			this.database.updatePayloads.push({ ...this.payload });
			for (const row of rows) Object.assign(row, this.payload);
		}
		return { data: rows[0] ?? null, error: null };
	}
}

export class MusicTestDatabase {
	invitations: Row[];
	objects = new Map<string, { size: number; contentType: string }>();
	signedUploadPaths: string[] = [];
	signedReadPaths: Array<{ path: string; expiresIn: number }> = [];
	removedPaths: string[][] = [];
	updatePayloads: Row[] = [];
	removeError: Row | null = null;

	constructor(
		ownerId: string,
		invitationId: string,
		otherOwnerId: string,
		otherInvitationId: string,
	) {
		this.invitations = [
			{ id: invitationId, couple_id: ownerId, music_path: null },
			{ id: otherInvitationId, couple_id: otherOwnerId, music_path: null },
		];
	}

	client = {
		from: () => new MusicQuery(this),
		storage: {
			from: () => ({
				createSignedUploadUrl: async (path: string) => {
					this.signedUploadPaths.push(path);
					return {
						data: { signedUrl: "https://storage.test/upload" },
						error: null,
					};
				},
				info: async (path: string) => {
					const object = this.objects.get(path);
					return object
						? { data: object, error: null }
						: { data: null, error: { status: 404 } };
				},
				remove: async (paths: string[]) => {
					this.removedPaths.push(paths);
					if (this.removeError) return { data: null, error: this.removeError };
					for (const path of paths) this.objects.delete(path);
					return { data: [], error: null };
				},
				createSignedUrl: async (path: string, expiresIn: number) => {
					this.signedReadPaths.push({ path, expiresIn });
					return {
						data: {
							signedUrl: "https://storage.test/read?signature=temporary",
						},
						error: null,
					};
				},
			}),
		},
	};
}
