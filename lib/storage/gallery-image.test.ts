import { describe, expect, it } from "vitest";
import { getGalleryImagePath } from "./gallery-image";

describe("gallery image path", () => {
	it("uses the canonical owner/invitation/item path", () => {
		expect(getGalleryImagePath("owner", "invitation", "item")).toBe(
			"owner/invitation/gallery/item.webp",
		);
	});
});
