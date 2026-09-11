import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	createGalleryImageUploadUrl,
	persistGalleryImage,
} from "./gallery-image";
import { GalleryTestDatabase } from "./gallery-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";
const itemId = "00000000-0000-4000-8000-000000000300";

describe("gallery image actions", () => {
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

	it("creates a signed upload only at a server-derived canonical path", async () => {
		const result = await createGalleryImageUploadUrl(invitationId);
		expect(result.galleryItemId).toMatch(/^[0-9a-f-]{36}$/);
		expect(database.signedPaths).toEqual([
			`${ownerId}/${invitationId}/gallery/${result.galleryItemId}.webp`,
		]);
	});

	it("rejects a foreign invitation before issuing upload authorization", async () => {
		await expect(
			createGalleryImageUploadUrl(otherInvitationId),
		).rejects.toThrow("Tidak memiliki akses");
		expect(database.signedPaths).toEqual([]);
	});

	it("rejects upload authorization when the server-resolved image limit is full", async () => {
		for (let index = 0; index < 4; index += 1) {
			database.items.push({ type: "image" });
		}
		await expect(createGalleryImageUploadUrl(invitationId)).rejects.toThrow(
			"Batas gambar",
		);
		expect(database.signedPaths).toEqual([]);
	});

	it("does not persist a row when the canonical uploaded object is absent", async () => {
		await expect(persistGalleryImage(invitationId, itemId)).rejects.toThrow(
			"belum berhasil diunggah",
		);
		expect(database.items).toEqual([]);
		expect(database.rpcCalls.map(({ name }) => name)).not.toContain(
			"create_gallery_item_atomic",
		);
	});

	it("persists the server-derived image path after upload", async () => {
		const path = `${ownerId}/${invitationId}/gallery/${itemId}.webp`;
		database.objects.add(path);
		const item = await persistGalleryImage(invitationId, itemId);
		expect(item).toMatchObject({
			id: itemId,
			image_path: path,
			youtube_video_id: null,
		});
	});

	it("recognizes an ambiguous committed RPC result without deleting its object", async () => {
		const path = `${ownerId}/${invitationId}/gallery/${itemId}.webp`;
		database.objects.add(path);
		database.items.push({
			id: itemId,
			invitation_id: invitationId,
			type: "image",
			image_path: path,
			youtube_video_id: null,
			sort_order: 0,
		});
		database.createRpcError = { message: "network_failure" };
		await expect(
			persistGalleryImage(invitationId, itemId),
		).resolves.toMatchObject({ id: itemId });
		expect(database.removedPaths).toEqual([]);
	});

	it("compensates the canonical object when atomic persistence fails uncommitted", async () => {
		const path = `${ownerId}/${invitationId}/gallery/${itemId}.webp`;
		database.objects.add(path);
		database.createRpcError = { message: "gallery_image_limit_reached" };
		await expect(persistGalleryImage(invitationId, itemId)).rejects.toThrow(
			"Batas gambar",
		);
		expect(database.removedPaths).toEqual([[path]]);
	});
});
