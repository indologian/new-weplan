import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getOwnedInvitationReview: vi.fn(),
	getThemeRenderer: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("not-found");
	}),
}));
vi.mock("../../../../actions/invitations/review", () => ({
	getOwnedInvitationReview: mocks.getOwnedInvitationReview,
}));
vi.mock("../../../../themes/registry", () => ({
	getThemeRenderer: mocks.getThemeRenderer,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock(
	"../../../../features/invitation-builder/components/review-summary",
	() => ({ ReviewSummary: () => null }),
);

import ReviewPage from "./page";

describe("private review route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getOwnedInvitationReview.mockResolvedValue({
			rendererKey: "elegant-green",
		});
		mocks.getThemeRenderer.mockReturnValue(() => null);
	});

	it("loads the owned invitation identified by the private route", async () => {
		await expect(
			ReviewPage({ params: Promise.resolve({ invitationId: "owned-id" }) }),
		).resolves.toBeTruthy();
		expect(mocks.getOwnedInvitationReview).toHaveBeenCalledWith("owned-id");
	});

	it("propagates authentication and ownership rejection", async () => {
		mocks.getOwnedInvitationReview.mockRejectedValue(
			new Error("access denied"),
		);
		await expect(
			ReviewPage({ params: Promise.resolve({ invitationId: "foreign-id" }) }),
		).rejects.toThrow("access denied");
	});

	it("fails safely for an unallowlisted renderer", async () => {
		mocks.getThemeRenderer.mockReturnValue(null);
		await expect(
			ReviewPage({ params: Promise.resolve({ invitationId: "owned-id" }) }),
		).rejects.toThrow("not-found");
	});
});
