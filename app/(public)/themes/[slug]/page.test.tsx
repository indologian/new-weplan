import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	notFound: vi.fn(() => {
		throw new Error("not-found");
	}),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import ThemePreviewPage from "./page";

describe("public theme preview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("resolves the public elegant-green theme slug", async () => {
		const page = await ThemePreviewPage({
			params: Promise.resolve({ slug: "elegant-green" }),
		});

		expect(page.props.invitation.slug).toBe("john-jane");
		expect(page.props.invitation.theme.rendererKey).toBe("elegant-green");
		expect(mocks.notFound).not.toHaveBeenCalled();
	});

	it("returns safe not-found behavior for an unknown theme slug", async () => {
		await expect(
			ThemePreviewPage({
				params: Promise.resolve({ slug: "unknown-theme" }),
			}),
		).rejects.toThrow("not-found");
	});
});
