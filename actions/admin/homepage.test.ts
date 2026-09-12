import { describe, expect, it, vi } from "vitest";

const readSingle = vi.fn();
const writeSingle = vi.fn();
const readEq = vi.fn(() => ({ maybeSingle: readSingle }));
const writeSelect = vi.fn(() => ({ maybeSingle: writeSingle }));
const writeEq = vi.fn(() => ({ select: writeSelect }));
const update = vi.fn(() => ({ eq: writeEq }));
const from = vi.fn(() => ({ select: vi.fn(() => ({ eq: readEq })), update }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./context", () => ({
	requireAdminContext: vi.fn(async () => ({ supabase: { from } })),
}));

import { toggleAdminHomepageSection } from "./homepage";

describe("homepage visibility", () => {
	it("updates only is_visible for an existing configured section", async () => {
		readSingle.mockResolvedValue({
			data: { id: "11111111-1111-4111-8111-111111111111", section_key: "hero" },
			error: null,
		});
		writeSingle.mockResolvedValue({
			data: {
				id: "11111111-1111-4111-8111-111111111111",
				section_key: "hero",
				is_visible: false,
			},
			error: null,
		});
		await toggleAdminHomepageSection({
			sectionId: "11111111-1111-4111-8111-111111111111",
			isVisible: false,
		});
		expect(update).toHaveBeenCalledWith({ is_visible: false });
	});
	it("rejects navbar even if a row were introduced", async () => {
		readSingle.mockResolvedValue({
			data: {
				id: "11111111-1111-4111-8111-111111111111",
				section_key: "navbar",
			},
			error: null,
		});
		await expect(
			toggleAdminHomepageSection({
				sectionId: "11111111-1111-4111-8111-111111111111",
				isVisible: false,
			}),
		).rejects.toThrow("tidak valid");
		expect(update).not.toHaveBeenCalled();
	});
});
