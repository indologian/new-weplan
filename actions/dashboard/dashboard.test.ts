import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ requireCoupleDashboardContext: vi.fn() }));
vi.mock("../../lib/dashboard/authorization", () => ({
	requireCoupleDashboardContext: mocks.requireCoupleDashboardContext,
}));

import { getCoupleDashboard } from "./dashboard";
import { DashboardTestDatabase } from "./dashboard-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

describe("couple dashboard reads", () => {
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
	it("rejects unauthenticated access before querying", async () => {
		mocks.requireCoupleDashboardContext.mockRejectedValueOnce(
			new Error("Login"),
		);
		await expect(getCoupleDashboard()).rejects.toThrow("Login");
	});
	it("isolates multiple owned invitations and status aggregates", async () => {
		const dashboard = await getCoupleDashboard(invitationId);
		expect(dashboard.invitations.map(({ slug }) => slug)).toEqual([
			"owner-two",
			"owner-one",
		]);
		expect(dashboard.statusCounts).toEqual({
			draft: 1,
			paymentPending: 0,
			active: 1,
			expired: 0,
		});
	});
	it("rejects a cross-owner selected invitation", async () => {
		await expect(getCoupleDashboard(otherInvitationId)).rejects.toThrow(
			"tidak dapat diakses",
		);
	});
	it("derives RSVP totals only from the selected invitation", async () => {
		const dashboard = await getCoupleDashboard(invitationId);
		expect(dashboard.rsvpSummary).toEqual({
			totalGuests: 2,
			responded: 1,
			attending: 1,
			notAttending: 0,
			notResponded: 1,
			totalAttendingGuestCount: 3,
		});
		expect(dashboard.wishes).toHaveLength(1);
		expect(dashboard.overviewRsvpSummary.totalAttendingGuestCount).toBe(3);
		expect(dashboard.overviewWishesCount).toBe(1);
	});
	it("performs no payment or invitation lifecycle mutation", async () => {
		await getCoupleDashboard(invitationId);
		expect(database.mutationTables).toEqual([]);
		expect(database.tables.transactions).toBeUndefined();
	});
});
