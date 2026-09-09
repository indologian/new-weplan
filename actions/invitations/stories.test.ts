import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	createStory,
	deleteStory,
	getStories,
	reorderStories,
	updateStory,
} from "./stories";
import { StoryTestDatabase } from "./story-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

const content = (overrides: Record<string, unknown> = {}) => ({
	title: "Pertama Bertemu",
	storyDate: "2024-06-01",
	description: "Kami bertemu untuk pertama kalinya.",
	sortOrder: 99,
	...overrides,
});

describe("story actions", () => {
	let database: StoryTestDatabase;

	beforeEach(() => {
		vi.clearAllMocks();
		database = new StoryTestDatabase(
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
		mocks.requireAuthenticatedMutation.mockRejectedValue(new Error("Login"));
		await expect(getStories(invitationId)).rejects.toThrow("Login");
	});

	it("creates multiple stories with deterministic ordering and optional dates", async () => {
		await createStory(invitationId, content());
		await createStory(
			invitationId,
			content({ title: "Lamaran", storyDate: null }),
		);
		const stories = await getStories(invitationId);
		expect(stories.map(({ sortOrder }) => sortOrder)).toEqual([0, 1]);
		expect(stories[1]).toMatchObject({
			title: "Lamaran",
			storyDate: null,
			imagePath: null,
		});
	});

	it("rejects cross-owner creation", async () => {
		await expect(createStory(otherInvitationId, content())).rejects.toThrow(
			"Tidak memiliki akses",
		);
	});

	it("updates and deletes an owned story without an image", async () => {
		const story = await createStory(invitationId, content());
		const updated = await updateStory(
			invitationId,
			story.id,
			content({ title: "Hari Lamaran" }),
		);
		expect(updated.title).toBe("Hari Lamaran");
		await deleteStory(invitationId, story.id);
		expect(await getStories(invitationId)).toEqual([]);
		expect(database.removedPaths).toEqual([]);
	});

	it("rejects cross-invitation update and delete", async () => {
		const foreign = await seedForeignStory(database);
		await expect(
			updateStory(invitationId, foreign.id, content()),
		).rejects.toThrow("Cerita tidak ditemukan");
		await expect(deleteStory(invitationId, foreign.id)).rejects.toThrow(
			"Cerita tidak ditemukan",
		);
	});

	it("deletes the canonical private object before a story with an image", async () => {
		const story = await createStory(invitationId, content());
		database.stories[0].image_path = "client/controlled/path.webp";
		await deleteStory(invitationId, story.id);
		expect(database.removedPaths).toEqual([
			[`${ownerId}/${invitationId}/stories/${story.id}.webp`],
		]);
		expect(database.stories).toEqual([]);
	});

	it("reorders the complete story set into 0..n-1", async () => {
		const first = await createStory(invitationId, content());
		const second = await createStory(
			invitationId,
			content({ title: "Lamaran" }),
		);
		await reorderStories(invitationId, [second.id, first.id]);
		const stories = await getStories(invitationId);
		expect(stories.map(({ id, sortOrder }) => ({ id, sortOrder }))).toEqual([
			{ id: second.id, sortOrder: 0 },
			{ id: first.id, sortOrder: 1 },
		]);
	});

	it("rejects duplicate, missing, and foreign reorder IDs", async () => {
		const first = await createStory(invitationId, content());
		const second = await createStory(
			invitationId,
			content({ title: "Lamaran" }),
		);
		const foreign = await seedForeignStory(database);
		await expect(
			reorderStories(invitationId, [first.id, first.id]),
		).rejects.toThrow("Urutan cerita tidak valid");
		await expect(reorderStories(invitationId, [first.id])).rejects.toThrow(
			"Muat ulang",
		);
		await expect(
			reorderStories(invitationId, [first.id, foreign.id]),
		).rejects.toThrow("Muat ulang");
		expect(second.id).toBeTruthy();
	});
});

async function seedForeignStory(database: StoryTestDatabase) {
	mocks.requireAuthenticatedMutation.mockResolvedValueOnce({
		supabase: database.client,
		userId: otherOwnerId,
	});
	return createStory(otherInvitationId, content());
}
