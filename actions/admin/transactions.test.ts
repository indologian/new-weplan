import { describe, expect, it, vi } from "vitest";

const range = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
const order = vi.fn(() => ({ order, range }));
const select = vi.fn(() => ({ order }));
vi.mock("server-only", () => ({}));
vi.mock("./context", () => ({
	requireAdminContext: vi.fn(async () => ({
		supabase: { from: vi.fn(() => ({ select })) },
	})),
}));

import { getAdminTransactions } from "./transactions";

describe("admin transactions", () => {
	it("uses deterministic bounded read-only pagination", async () => {
		await getAdminTransactions({ page: 2, pageSize: 20 });
		expect(range).toHaveBeenCalledWith(20, 39);
		expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
		expect(order).toHaveBeenCalledWith("id", { ascending: false });
	});
});
