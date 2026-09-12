import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("./context", () => ({
	requireAdminContext: vi.fn(async () => ({ supabase: { rpc } })),
}));

import { getAdminOverview } from "./overview";

describe("admin overview", () => {
	it("uses only the bounded aggregate RPC and preserves bigint revenue", async () => {
		rpc.mockResolvedValue({
			data: [
				{
					total_paid_revenue: "9007199254740993",
					paid_transaction_count: 2,
					pending_transaction_count: 1,
					terminal_transaction_count: 3,
					active_invitation_count: 4,
				},
			],
			error: null,
		});
		await expect(getAdminOverview()).resolves.toEqual({
			totalPaidRevenue: "9007199254740993",
			paidTransactionCount: 2,
			pendingTransactionCount: 1,
			terminalTransactionCount: 3,
			activeInvitationCount: 4,
		});
		expect(rpc).toHaveBeenCalledWith("get_admin_overview_metrics");
	});
});
