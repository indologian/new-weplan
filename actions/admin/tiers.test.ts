import { describe, expect, it, vi } from "vitest";

const maybeSingle = vi
	.fn()
	.mockResolvedValue({ data: { id: "tier" }, error: null });
const select = vi.fn(() => ({ maybeSingle }));
const eq = vi.fn(() => ({ select }));
const update = vi.fn(() => ({ eq }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./context", () => ({
	requireAdminContext: vi.fn(async () => ({
		supabase: { from: vi.fn(() => ({ update })) },
	})),
}));

import { updateAdminTier } from "./tiers";

describe("admin tier mutation", () => {
	it("updates only approved future configuration fields", async () => {
		await updateAdminTier({
			id: "11111111-1111-4111-8111-111111111111",
			price: "001000",
			activeMonths: 6,
			maxGalleryImages: 8,
			maxYoutubeVideos: 2,
			isActive: false,
		});
		expect(update).toHaveBeenCalledWith({
			price: "1000",
			active_months: 6,
			max_gallery_images: 8,
			max_youtube_videos: 2,
			is_active: false,
		});
	});
	it("rejects code and snapshot injection", async () => {
		await expect(
			updateAdminTier({
				id: "11111111-1111-4111-8111-111111111111",
				price: "1000",
				activeMonths: 6,
				maxGalleryImages: 8,
				maxYoutubeVideos: 2,
				isActive: true,
				code: "vip",
				price_snapshot: 1,
			}),
		).rejects.toThrow("tidak valid");
	});
});
