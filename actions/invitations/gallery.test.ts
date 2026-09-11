import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	createYouTubeGalleryItem,
	deleteGalleryItem,
	getGalleryItems,
	reorderGalleryItems,
	updateYouTubeGalleryItem,
} from "./gallery";
import { GalleryTestDatabase } from "./gallery-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

describe("gallery actions", () => {
	let database: GalleryTestDatabase;
	beforeEach(() => {
		database = new GalleryTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("requires authentication", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValueOnce(
			new Error("Login"),
		);
		await expect(getGalleryItems(invitationId)).rejects.toThrow("Login");
	});

	it("normalizes YouTube input and sends no client tier or path data", async () => {
		const item = await createYouTubeGalleryItem(
			invitationId,
			"https://youtu.be/dQw4w9WgXcQ",
		);
		expect(item).toMatchObject({
			type: "youtube",
			youtubeVideoId: "dQw4w9WgXcQ",
			sortOrder: 0,
		});
		expect(database.rpcCalls[0]).toEqual({
			name: "create_gallery_item_atomic",
			input: expect.objectContaining({
				p_invitation_id: invitationId,
				p_media_type: "youtube",
				p_youtube_video_id: "dQw4w9WgXcQ",
			}),
		});
		expect(Object.keys(database.rpcCalls[0].input).sort()).toEqual([
			"p_gallery_item_id",
			"p_invitation_id",
			"p_media_type",
			"p_youtube_video_id",
		]);
	});

	it("rejects foreign invitations and cross-invitation item IDs", async () => {
		await expect(
			createYouTubeGalleryItem(otherInvitationId, "dQw4w9WgXcQ"),
		).rejects.toThrow("Tidak memiliki akses");
		database.items.push({
			id: "00000000-0000-4000-8000-000000000300",
			invitation_id: otherInvitationId,
			type: "youtube",
			image_path: null,
			youtube_video_id: "dQw4w9WgXcQ",
			sort_order: 0,
		});
		await expect(
			updateYouTubeGalleryItem(
				invitationId,
				String(database.items[0].id),
				"M7lc1UVf-VE",
			),
		).rejects.toThrow("tidak ditemukan");
		await expect(
			deleteGalleryItem(invitationId, String(database.items[0].id)),
		).rejects.toThrow("tidak ditemukan");
	});

	it("deletes an image using its canonical path, not persisted client data", async () => {
		const id = "00000000-0000-4000-8000-000000000301";
		database.items.push({
			id,
			invitation_id: invitationId,
			type: "image",
			image_path: "evil/path.webp",
			youtube_video_id: null,
			sort_order: 0,
		});
		database.objects.add(`${ownerId}/${invitationId}/gallery/${id}.webp`);
		await deleteGalleryItem(invitationId, id);
		expect(database.removedPaths).toEqual([
			[`${ownerId}/${invitationId}/gallery/${id}.webp`],
		]);
		expect(database.items).toEqual([]);
	});

	it("updates and deletes YouTube media without touching Storage", async () => {
		const item = await createYouTubeGalleryItem(invitationId, "dQw4w9WgXcQ");
		const updated = await updateYouTubeGalleryItem(
			invitationId,
			item.id,
			"https://youtube.com/watch?v=M7lc1UVf-VE",
		);
		expect(updated).toMatchObject({ youtubeVideoId: "M7lc1UVf-VE" });
		await deleteGalleryItem(invitationId, item.id);
		expect(database.removedPaths).toEqual([]);
		expect(database.items).toEqual([]);
	});

	it("reorders the complete mixed set into deterministic 0..n-1 order", async () => {
		const first = await createYouTubeGalleryItem(invitationId, "dQw4w9WgXcQ");
		const second = await createYouTubeGalleryItem(invitationId, "M7lc1UVf-VE");
		await reorderGalleryItems(invitationId, [second.id, first.id]);
		expect(
			(await getGalleryItems(invitationId)).map(({ id, sortOrder }) => ({
				id,
				sortOrder,
			})),
		).toEqual([
			{ id: second.id, sortOrder: 0 },
			{ id: first.id, sortOrder: 1 },
		]);
	});

	it("rejects duplicate, missing, stale, and foreign reorder IDs", async () => {
		const first = await createYouTubeGalleryItem(invitationId, "dQw4w9WgXcQ");
		const second = await createYouTubeGalleryItem(invitationId, "M7lc1UVf-VE");
		const foreignId = "00000000-0000-4000-8000-000000000399";
		await expect(
			reorderGalleryItems(invitationId, [first.id, first.id]),
		).rejects.toThrow("Urutan galeri tidak valid");
		await expect(reorderGalleryItems(invitationId, [first.id])).rejects.toThrow(
			"Muat ulang",
		);
		await expect(
			reorderGalleryItems(invitationId, [first.id, foreignId]),
		).rejects.toThrow("Muat ulang");
		expect(second.id).toBeTruthy();
	});
});
