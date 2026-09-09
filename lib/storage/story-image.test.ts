import { describe, expect, it } from "vitest";
import { getStoryImagePath } from "./story-image";

describe("story image path", () => {
	it("uses trusted owner, invitation, and story identifiers", () => {
		expect(getStoryImagePath("couple-1", "invitation-1", "story-1")).toBe(
			"couple-1/invitation-1/stories/story-1.webp",
		);
	});
});
