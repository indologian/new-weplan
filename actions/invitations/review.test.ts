import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import { getOwnedBuilderResume, getOwnedInvitationReview } from "./review";
import { ReviewTestDatabase } from "./review-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const foreignInvitationId = "00000000-0000-4000-8000-000000000200";

describe("owned invitation review", () => {
	let database: ReviewTestDatabase;

	beforeEach(() => {
		database = new ReviewTestDatabase(ownerId, invitationId, otherOwnerId);
		mocks.requireAuthenticatedMutation.mockReset();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("loads persisted owner content in deterministic order", async () => {
		const review = await getOwnedInvitationReview(invitationId);
		expect(review.viewModel.greeting).toBe("Persisted greeting");
		expect(review.viewModel.events.map(({ id }) => id)).toEqual([
			"event-main",
			"event-later",
		]);
		expect(review.viewModel.theme.rendererKey).toBe("elegant-green");
	});

	it("resolves current commercial data only from server relations", async () => {
		const review = await getOwnedInvitationReview(invitationId);
		expect(review.commercial).toEqual({
			themeName: "Elegant Green",
			tierCode: "premium",
			tierName: "Premium",
			price: "250000",
			activeMonths: 12,
		});
	});

	it("rejects unauthenticated review before reading data", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValue(new Error("Login"));
		await expect(getOwnedInvitationReview(invitationId)).rejects.toThrow(
			"Login",
		);
		expect(database.fromTables).toEqual([]);
	});

	it("rejects a foreign owner before children or assets are loaded", async () => {
		await expect(getOwnedInvitationReview(foreignInvitationId)).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(database.fromTables).toEqual(["invitations"]);
		expect(database.signedBatches).toEqual([]);
	});

	it("batch-signs canonical private assets without persisting URLs", async () => {
		const updatesBefore = JSON.stringify(database.tables.invitations);
		const review = await getOwnedInvitationReview(invitationId);
		expect(database.signedBatches).toEqual([
			{
				paths: [`${ownerId}/${invitationId}/cover/cover.webp`],
				expiresIn: 3600,
			},
		]);
		expect(review.viewModel.coverPhotoUrl).toContain("https://signed.test/");
		expect(JSON.stringify(database.tables.invitations)).toBe(updatesBefore);
	});

	it("resumes the same owned invitation with persisted identity", async () => {
		await expect(getOwnedBuilderResume(invitationId)).resolves.toMatchObject({
			invitationId,
			themeSlug: "elegant-green",
			identity: { slug: "persisted-couple", groom_name: "Groom" },
		});
	});

	it("performs no transaction or lifecycle mutation", async () => {
		const before = structuredClone(database.tables.invitations);
		await getOwnedInvitationReview(invitationId);
		expect(database.tables.invitations).toEqual(before);
		expect(database.fromTables).not.toContain("transactions");
	});
});
