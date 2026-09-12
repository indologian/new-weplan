import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { requireAdminProfile } = vi.hoisted(() => ({
	requireAdminProfile: vi.fn(),
}));
vi.mock("@/lib/auth/authorization", () => ({ requireAdminProfile }));

import AdminDashboardLayout from "./layout";

describe("admin dashboard layout", () => {
	it("requires the existing server-side admin gate", async () => {
		requireAdminProfile.mockResolvedValue({ id: "admin", role: "admin" });
		const markup = renderToStaticMarkup(
			await AdminDashboardLayout({ children: <p>Admin content</p> }),
		);
		expect(requireAdminProfile).toHaveBeenCalledOnce();
		expect(markup).toContain("Admin content");
	});

	it("does not render when the admin gate rejects", async () => {
		requireAdminProfile.mockRejectedValue(new Error("forbidden"));
		await expect(
			AdminDashboardLayout({ children: <p>Admin content</p> }),
		).rejects.toThrow("forbidden");
	});
});
