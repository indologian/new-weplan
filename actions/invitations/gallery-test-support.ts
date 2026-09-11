import { vi } from "vitest";

type Row = Record<string, unknown>;

class Query {
	private operation: "select" | "update" | "delete" = "select";
	private payload: Row = {};
	private filters: Array<[string, unknown]> = [];
	private orderBy: string | null = null;

	constructor(
		private database: GalleryTestDatabase,
		private table: string,
	) {}
	select() {
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
	order(column: string) {
		this.orderBy = column;
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

export class GalleryTestDatabase {
	items: Row[] = [];
	objects = new Set<string>();
	signedPaths: string[] = [];
	removedPaths: string[][] = [];
	rpcCalls: Array<{ name: string; input: Row }> = [];
	createRpcError: { message: string } | null = null;
	constructor(
		readonly ownerId: string,
		readonly invitationId: string,
		readonly otherOwnerId: string,
		readonly otherInvitationId: string,
	) {}

	private invitations = () => [
		{ id: this.invitationId, couple_id: this.ownerId },
		{ id: this.otherInvitationId, couple_id: this.otherOwnerId },
	];

	client = {
		from: (table: string) => new Query(this, table),
		rpc: vi.fn(async (name: string, input: Row) => {
			this.rpcCalls.push({ name, input });
			const invitation = this.invitations().find(
				({ id }) => id === input.p_invitation_id,
			);
			if (!invitation || invitation.couple_id !== this.ownerId) {
				return { data: null, error: { message: "gallery_access_denied" } };
			}
			if (name === "get_gallery_capacity") {
				return {
					data: [
						{
							max_gallery_images: 4,
							max_youtube_videos: 1,
							current_gallery_images: this.items.filter(
								({ type }) => type === "image",
							).length,
							current_youtube_videos: this.items.filter(
								({ type }) => type === "youtube",
							).length,
						},
					],
					error: null,
				};
			}
			if (this.createRpcError)
				return { data: null, error: this.createRpcError };
			const type = input.p_media_type;
			const id = input.p_gallery_item_id;
			const row = {
				id,
				invitation_id: input.p_invitation_id,
				type,
				image_path:
					type === "image"
						? `${this.ownerId}/${input.p_invitation_id}/gallery/${id}.webp`
						: null,
				youtube_video_id: type === "youtube" ? input.p_youtube_video_id : null,
				sort_order: this.items.length,
			};
			this.items.push(row);
			return { data: [row], error: null };
		}),
		storage: {
			from: vi.fn(() => ({
				info: async (path: string) =>
					this.objects.has(path)
						? {
								data: { size: 100, contentType: "image/webp" },
								error: null,
							}
						: { data: null, error: { status: 404 } },
				createSignedUploadUrl: async (path: string) => {
					this.signedPaths.push(path);
					return {
						data: { signedUrl: "https://storage.test/upload" },
						error: null,
					};
				},
				list: async (folder: string, options: { search: string }) => ({
					data: this.objects.has(`${folder}/${options.search}`)
						? [{ name: options.search }]
						: [],
					error: null,
				}),
				remove: async (paths: string[]) => {
					this.removedPaths.push(paths);
					for (const path of paths) this.objects.delete(path);
					return { data: [], error: null };
				},
			})),
		},
	};

	execute(
		table: string,
		operation: "select" | "update" | "delete",
		payload: Row,
		filters: Array<[string, unknown]>,
		orderBy: string | null,
	) {
		const source: Row[] =
			table === "invitations" ? this.invitations() : this.items;
		const matches = (row: Row) =>
			filters.every(([key, value]) => row[key] === value);
		if (operation === "update") {
			const rows = source.filter(matches);
			for (const row of rows) Object.assign(row, payload);
			return { data: rows, error: null };
		}
		if (operation === "delete") {
			const rows = this.items.filter(matches);
			this.items = this.items.filter((row) => !matches(row));
			return { data: rows, error: null };
		}
		let rows = source.filter(matches);
		if (orderBy)
			rows = [...rows].sort((a, b) => Number(a[orderBy]) - Number(b[orderBy]));
		return { data: rows, error: null };
	}
}
