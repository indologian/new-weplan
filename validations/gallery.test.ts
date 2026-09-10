import { describe, expect, it } from "vitest";
import { galleryMediaTypeSchema, reorderGallerySchema } from "./gallery";

describe("gallery validation", () => {
	it.each(["image", "youtube"])("accepts media type %s", (type) => {
		expect(galleryMediaTypeSchema.safeParse(type).success).toBe(true);
	});

	it("rejects unsupported media types", () => {
		expect(galleryMediaTypeSchema.safeParse("iframe").success).toBe(false);
	});

	it("rejects duplicate reorder IDs", () => {
		const id = "00000000-0000-4000-8000-000000000001";
		expect(reorderGallerySchema.safeParse([id, id]).success).toBe(false);
	});
});
