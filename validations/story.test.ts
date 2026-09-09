import { describe, expect, it } from "vitest";
import {
	reorderStoriesSchema,
	storyContentInputSchema,
	storySchema,
} from "./story";

const validStory = {
	title: "Pertama Bertemu",
	storyDate: "2024-06-01",
	description: "Kami bertemu untuk pertama kalinya.",
	sortOrder: 0,
};

describe("story validation", () => {
	it("accepts content with a date", () => {
		expect(storyContentInputSchema.safeParse(validStory).success).toBe(true);
	});

	it("keeps an omitted story date as null", () => {
		const parsed = storyContentInputSchema.parse({
			...validStory,
			storyDate: null,
		});
		expect(parsed.storyDate).toBeNull();
	});

	it("supports a nullable image path in the returned story contract", () => {
		expect(
			storySchema.parse({
				...validStory,
				id: "00000000-0000-4000-8000-000000000001",
				imagePath: null,
			}).imagePath,
		).toBeNull();
	});

	it("does not accept an image path as content persistence input", () => {
		expect(
			"imagePath" in
				storyContentInputSchema.parse({
					...validStory,
					imagePath: "arbitrary/path.webp",
				}),
		).toBe(false);
	});

	it("rejects duplicate reorder IDs", () => {
		const id = "00000000-0000-4000-8000-000000000001";
		expect(reorderStoriesSchema.safeParse([id, id]).success).toBe(false);
	});
});
