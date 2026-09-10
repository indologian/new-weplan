import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getOwnedInvitationReview: vi.fn(),
	getThemeRenderer: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("not-found");
	}),
}));
vi.mock("../../../../../actions/invitations/review", () => ({
	getOwnedInvitationReview: mocks.getOwnedInvitationReview,
}));
vi.mock("../../../../../themes/registry", () => ({
	getThemeRenderer: mocks.getThemeRenderer,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock(
	"../../../../../features/invitation-builder/components/private-preview",
	() => ({ PrivatePreview: () => null }),
);

import PreviewPage from "./page";

describe("private preview route", () => {
	it("loads persisted review data and resolves the allowlisted renderer", async () => {
		mocks.getOwnedInvitationReview.mockResolvedValue({
			rendererKey: "elegant-green",
			viewModel: {},
			themeSlug: "elegant-green",
		});
		mocks.getThemeRenderer.mockReturnValue(() => null);
		await expect(
			PreviewPage({ params: Promise.resolve({ invitationId: "owned-id" }) }),
		).resolves.toBeTruthy();
		expect(mocks.getOwnedInvitationReview).toHaveBeenCalledWith("owned-id");
		expect(mocks.getThemeRenderer).toHaveBeenCalledWith("elegant-green");
	});

	it("fails safely before render for an unknown renderer", async () => {
		mocks.getOwnedInvitationReview.mockResolvedValue({
			rendererKey: "unknown",
			viewModel: {},
			themeSlug: "unknown",
		});
		mocks.getThemeRenderer.mockReturnValue(null);
		await expect(
			PreviewPage({ params: Promise.resolve({ invitationId: "owned-id" }) }),
		).rejects.toThrow("not-found");
	});
});
