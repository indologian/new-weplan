import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import { createStoryImageUploadUrl, persistStoryImage } from "./story-image";
import { StoryTestDatabase } from "./story-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";
const storyId = "00000000-0000-4000-8000-000000000001";
const foreignStoryId = "00000000-0000-4000-8000-000000000002";

describe("story image actions", () => {
	let database: StoryTestDatabase;

	beforeEach(() => {
		vi.clearAllMocks();
		database = new StoryTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		database.stories = [
			{ id: storyId, invitation_id: invitationId, image_path: null },
			{
				id: foreignStoryId,
				invitation_id: otherInvitationId,
				image_path: null,
			},
		];
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("authorizes only the canonical overwrite path without persisting early", async () => {
		const result = await createStoryImageUploadUrl(invitationId, storyId);
		expect(result.signedUrl).toBe("https://storage.test/signed");
		expect(database.signedPaths).toEqual([
			`${ownerId}/${invitationId}/stories/${storyId}.webp`,
		]);
		expect(database.stories[0].image_path).toBeNull();
	});

	it("persists a server-calculated canonical path only after upload", async () => {
		const result = await persistStoryImage(invitationId, storyId);
		expect(result.imagePath).toBe(
			`${ownerId}/${invitationId}/stories/${storyId}.webp`,
		);
		expect(database.stories[0].image_path).toBe(result.imagePath);
	});

	it("rejects story IDs from another invitation for upload and persistence", async () => {
		await expect(
			createStoryImageUploadUrl(invitationId, foreignStoryId),
		).rejects.toThrow("Cerita tidak ditemukan");
		await expect(
			persistStoryImage(invitationId, foreignStoryId),
		).rejects.toThrow("Cerita tidak ditemukan");
		expect(database.signedPaths).toEqual([]);
	});

	it("rejects an invitation owned by another couple", async () => {
		await expect(
			createStoryImageUploadUrl(otherInvitationId, foreignStoryId),
		).rejects.toThrow("Tidak memiliki akses");
	});
});
