import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({ randomUUID: () => "run-id" }));
vi.mock("../supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("../storage/cleanup", () => ({
	cleanupTrustedInvitationAssets: vi.fn(),
}));

import {
	cleanupThenDeleteInvitation,
	runInvitationLifecycle,
} from "./invitation-lifecycle";

const candidate = {
	id: "00000000-0000-4000-8000-000000000100",
	coupleId: "00000000-0000-4000-8000-000000000010",
};

const cleanupResult = (
	outcome: "complete" | "already-absent" | "incomplete" | "partial-failure",
) => ({
	outcome,
	deleted: [],
	alreadyAbsent: [],
	failed: [],
	traversalComplete: outcome !== "incomplete",
	listRequests: 1,
});

describe("invitation lifecycle", () => {
	it("conditionally expires bounded candidates and deletes only after Storage", async () => {
		const order: string[] = [];
		const database = {
			findExpiryCandidates: vi.fn(async (_now, limit) => {
				expect(limit).toBe(50);
				return [candidate.id];
			}),
			expireCandidates: vi.fn(async () => 1),
			findDeletionCandidates: vi.fn(async (_now, limit) => {
				expect(limit).toBe(3);
				return [candidate];
			}),
			deleteExpiredCandidate: vi.fn(async () => {
				order.push("database");
				return true;
			}),
		};
		const cleanup = vi.fn(async () => {
			order.push("storage");
			return cleanupResult("complete");
		});
		const result = await runInvitationLifecycle({
			source: "scheduled",
			database,
			cleanup,
			now: new Date("2026-09-12T00:00:00Z"),
		});

		expect(order).toEqual(["storage", "database"]);
		expect(result).toMatchObject({ expiredCount: 1, deletedCount: 1 });
	});

	it.each(["incomplete", "partial-failure"] as const)(
		"retains the database row when Storage is %s",
		async (outcome) => {
			const remove = vi.fn(async () => true);
			const result = await cleanupThenDeleteInvitation(
				candidate,
				remove,
				async () => cleanupResult(outcome),
			);
			expect(result).toBe(
				outcome === "incomplete" ? "storage-incomplete" : "storage-failed",
			);
			expect(remove).not.toHaveBeenCalled();
		},
	);

	it("treats a stale conditional delete as a retry-safe no-op", async () => {
		await expect(
			cleanupThenDeleteInvitation(
				candidate,
				async () => false,
				async () => cleanupResult("already-absent"),
			),
		).resolves.toBe("stale");
	});

	it("reports already-absent Storage while completing the database delete", async () => {
		await expect(
			cleanupThenDeleteInvitation(
				candidate,
				async () => true,
				async () => cleanupResult("already-absent"),
			),
		).resolves.toBe("deleted-after-absent");
	});
});
