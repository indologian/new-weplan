import { describe, expect, it } from "vitest";
import {
	adminHomepageToggleSchema,
	adminPaginationSchema,
	adminThemeSchema,
	adminTierUpdateSchema,
} from "./admin";

describe("admin validation", () => {
	it("bounds pagination", () => {
		expect(adminPaginationSchema.parse({ page: "2", pageSize: "50" })).toEqual({
			page: 2,
			pageSize: 50,
		});
		expect(
			adminPaginationSchema.safeParse({ page: 1, pageSize: 51 }).success,
		).toBe(false);
	});
	it("keeps price integer and lossless", () => {
		const result = adminTierUpdateSchema.parse({
			id: "11111111-1111-4111-8111-111111111111",
			price: "9007199254740993",
			activeMonths: 3,
			maxGalleryImages: 4,
			maxYoutubeVideos: 0,
			isActive: true,
		});
		expect(result.price).toBe(9007199254740993n);
	});
	it.each(["-1", "1.5", "1e3"])("rejects invalid price %s", (price) => {
		expect(
			adminTierUpdateSchema.safeParse({
				id: "11111111-1111-4111-8111-111111111111",
				price,
				activeMonths: 3,
				maxGalleryImages: 4,
				maxYoutubeVideos: 0,
				isActive: true,
			}).success,
		).toBe(false);
	});
	it("rejects arbitrary mutation fields", () => {
		expect(
			adminHomepageToggleSchema.safeParse({
				sectionId: "11111111-1111-4111-8111-111111111111",
				isVisible: true,
				html: "<b>x</b>",
			}).success,
		).toBe(false);
		expect(
			adminThemeSchema.safeParse({
				name: "Theme",
				slug: "theme",
				tierId: "11111111-1111-4111-8111-111111111111",
				description: null,
				thumbnailPath: "themes/x.webp",
				previewPath: null,
				rendererKey: "elegant-green",
				isActive: true,
				status: "paid",
			}).success,
		).toBe(false);
	});
});
