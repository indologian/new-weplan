import { beforeEach, describe, expect, it, vi } from "vitest";

const context = vi.fn();
const renderer = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./context", () => ({ requireAdminContext: () => context() }));
vi.mock("../../themes/registry", () => ({
	getThemeRenderer: (...args: unknown[]) => renderer(...args),
}));

import {
	createAdminTheme,
	disableAdminTheme,
	updateAdminTheme,
} from "./themes";

const valid = {
	name: "Elegant",
	slug: "elegant-admin",
	tierId: "11111111-1111-4111-8111-111111111111",
	description: null,
	thumbnailPath: "themes/elegant.webp",
	previewPath: null,
	rendererKey: "elegant-green",
	isActive: true,
};
describe("admin themes", () => {
	const tierSingle = vi.fn();
	const themeSingle = vi.fn();
	const themeMaybeSingle = vi.fn();
	const insert = vi.fn(() => ({
		select: vi.fn(() => ({ single: themeSingle })),
	}));
	const update = vi.fn(() => ({
		eq: vi.fn(() => ({
			select: vi.fn(() => ({ maybeSingle: themeMaybeSingle })),
		})),
	}));
	beforeEach(() => {
		renderer.mockReturnValue(() => null);
		tierSingle.mockResolvedValue({ data: { id: valid.tierId }, error: null });
		themeSingle.mockResolvedValue({ data: { id: "theme" }, error: null });
		themeMaybeSingle.mockResolvedValue({ data: { id: "theme" }, error: null });
		context.mockResolvedValue({
			supabase: {
				from: vi.fn((table: string) =>
					table === "tiers"
						? {
								select: vi.fn(() => ({
									eq: vi.fn(() => ({ maybeSingle: tierSingle })),
								})),
							}
						: { insert, update },
				),
			},
		});
	});

	it("creates valid allowlisted metadata", async () => {
		await expect(createAdminTheme(valid)).resolves.toEqual({ id: "theme" });
		expect(insert).toHaveBeenCalledWith(
			expect.objectContaining({
				renderer_key: "elegant-green",
				tier_id: valid.tierId,
			}),
		);
	});

	it("updates only allowlisted metadata", async () => {
		await updateAdminTheme({
			...valid,
			id: "22222222-2222-4222-8222-222222222222",
			name: "Updated",
		});
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Updated",
				renderer_key: "elegant-green",
			}),
		);
	});

	it("disables rather than deleting", async () => {
		await disableAdminTheme({
			id: "22222222-2222-4222-8222-222222222222",
		});
		expect(update).toHaveBeenCalledWith({ is_active: false });
	});

	it("rejects unknown renderer before database access", async () => {
		renderer.mockReturnValue(null);
		await expect(createAdminTheme(valid)).rejects.toThrow(
			"Renderer tema tidak dikenal",
		);
		expect(context).toHaveBeenCalledOnce();
	});
	it("rejects unrelated database fields", async () => {
		await expect(
			createAdminTheme({ ...valid, paid_at: "now" }),
		).rejects.toThrow("Data tema tidak valid");
	});
});
