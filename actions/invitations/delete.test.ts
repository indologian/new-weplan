import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuthenticatedMutation: vi.fn(),
	cleanupThenDeleteInvitation: vi.fn(),
}));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));
vi.mock("../../lib/lifecycle/invitation-lifecycle", () => ({
	cleanupThenDeleteInvitation: mocks.cleanupThenDeleteInvitation,
}));

import { permanentlyDeleteInvitationService as permanentlyDeleteInvitation } from "./delete-service";

const invitationId = "00000000-0000-4000-8000-000000000100";
const userId = "00000000-0000-4000-8000-000000000010";

function ownedClient(owned = true) {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const method of ["select", "eq", "delete"]) {
		query[method] = vi.fn(() => query);
	}
	query.maybeSingle = vi.fn(async () => ({
		data: owned ? { id: invitationId, couple_id: userId } : null,
		error: null,
	}));
	return { from: vi.fn(() => query) };
}

describe("permanent invitation deletion", () => {
	beforeEach(() => vi.clearAllMocks());

	it("requires explicit permanent-delete intent", async () => {
		await expect(permanentlyDeleteInvitation({ invitationId })).rejects.toThrow(
			"Konfirmasi",
		);
		expect(mocks.requireAuthenticatedMutation).not.toHaveBeenCalled();
	});

	it("rejects unauthenticated deletion before ownership or Storage", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValue(new Error("Login"));
		await expect(
			permanentlyDeleteInvitation({ invitationId, intent: "PERMANENT_DELETE" }),
		).rejects.toThrow("Login");
		expect(mocks.cleanupThenDeleteInvitation).not.toHaveBeenCalled();
	});

	it("rejects a foreign invitation before privileged cleanup", async () => {
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			userId,
			supabase: ownedClient(false),
		});
		await expect(
			permanentlyDeleteInvitation({ invitationId, intent: "PERMANENT_DELETE" }),
		).rejects.toThrow("Tidak memiliki akses");
		expect(mocks.cleanupThenDeleteInvitation).not.toHaveBeenCalled();
	});

	it("uses the shared Storage-first lifecycle after ownership verification", async () => {
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			userId,
			supabase: ownedClient(),
		});
		mocks.cleanupThenDeleteInvitation.mockResolvedValue("deleted");
		await expect(
			permanentlyDeleteInvitation({ invitationId, intent: "PERMANENT_DELETE" }),
		).resolves.toEqual({ deleted: true, outcome: "deleted" });
		expect(mocks.cleanupThenDeleteInvitation).toHaveBeenCalledWith(
			{ id: invitationId, coupleId: userId },
			expect.any(Function),
		);
	});

	it("keeps the invitation when Storage cleanup is incomplete", async () => {
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			userId,
			supabase: ownedClient(),
		});
		mocks.cleanupThenDeleteInvitation.mockResolvedValue("storage-incomplete");
		await expect(
			permanentlyDeleteInvitation({ invitationId, intent: "PERMANENT_DELETE" }),
		).rejects.toThrow("belum seluruhnya terhapus");
	});
});
