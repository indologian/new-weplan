import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ requireCoupleDashboardContext: vi.fn() }));
vi.mock("../../lib/dashboard/authorization", () => ({
	requireCoupleDashboardContext: mocks.requireCoupleDashboardContext,
}));

import { DashboardTestDatabase } from "./dashboard-test-support";
import { deleteDashboardWish } from "./wishes";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

describe("dashboard Wishes mutation", () => {
	let database: DashboardTestDatabase;
	beforeEach(() => {
		database = new DashboardTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		mocks.requireCoupleDashboardContext.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
			profile: { id: ownerId, fullName: "Owner", role: "couple" },
		});
	});
	it("deletes an owned Wish", async () => {
		await deleteDashboardWish(
			invitationId,
			"00000000-0000-4000-8000-000000000501",
		);
		expect(database.tables.wishes).toHaveLength(1);
	});
	it("rejects foreign and cross-invitation Wish IDs", async () => {
		await expect(
			deleteDashboardWish(invitationId, "00000000-0000-4000-8000-000000000599"),
		).rejects.toThrow("tidak dapat diakses");
		await expect(
			deleteDashboardWish(
				otherInvitationId,
				"00000000-0000-4000-8000-000000000599",
			),
		).rejects.toThrow("Undangan tidak dapat diakses");
	});
	it("rejects unauthenticated deletion", async () => {
		mocks.requireCoupleDashboardContext.mockRejectedValueOnce(
			new Error("Login"),
		);
		await expect(
			deleteDashboardWish(invitationId, "00000000-0000-4000-8000-000000000501"),
		).rejects.toThrow("Login");
	});
});
