import { describe, expect, it } from "vitest";
import { getBuilderEditHref, getBuilderReviewHref } from "./navigation";

describe("builder review navigation", () => {
	it("returns to the same persisted invitation", () => {
		expect(getBuilderEditHref("elegant-green", "same-invitation")).toBe(
			"/create/elegant-green?invitationId=same-invitation",
		);
		expect(getBuilderReviewHref("same-invitation")).toBe(
			"/create/review/same-invitation",
		);
	});
});
