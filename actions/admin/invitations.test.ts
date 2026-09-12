import { describe, expect, it, vi } from "vitest";

const range = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
const order = vi.fn(() => ({ order, range }));
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
vi.mock("server-only", () => ({}));
vi.mock("./context", () => ({
	requireAdminContext: vi.fn(async () => ({
		supabase: { from: vi.fn(() => ({ select })) },
	})),
}));

import { getAdminActiveInvitations } from "./invitations";

describe("admin active invitations", () => {
	it("lists only active rows without lifecycle mutation", async () => {
		await getAdminActiveInvitations({ page: 1, pageSize: 10 });
		expect(eq).toHaveBeenCalledWith("status", "active");
		expect(range).toHaveBeenCalledWith(0, 9);
	});
});
