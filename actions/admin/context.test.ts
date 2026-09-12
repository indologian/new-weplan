import { describe, expect, it, vi } from "vitest";

const { requireAdminProfile, createClient } = vi.hoisted(() => ({
	requireAdminProfile: vi.fn(),
	createClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("../../lib/auth/authorization", () => ({ requireAdminProfile }));
vi.mock("../../lib/supabase/server", () => ({ createClient }));

import { requireAdminContext } from "./context";

describe("admin context", () => {
	it("derives role from the existing server authorization boundary", async () => {
		const profile = { id: "admin", fullName: "Admin", role: "admin" };
		const supabase = {};
		requireAdminProfile.mockResolvedValue(profile);
		createClient.mockResolvedValue(supabase);
		await expect(requireAdminContext()).resolves.toEqual({ profile, supabase });
		expect(requireAdminProfile).toHaveBeenCalledOnce();
	});
	it("does not create a client if authorization rejects", async () => {
		createClient.mockClear();
		requireAdminProfile.mockRejectedValue(new Error("forbidden"));
		await expect(requireAdminContext()).rejects.toThrow("forbidden");
		expect(createClient).not.toHaveBeenCalled();
	});
});
