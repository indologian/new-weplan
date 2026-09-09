import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("not-found");
	}),
}));

vi.mock("../../../lib/supabase/server", () => ({
	createClient: mocks.createClient,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock(
	"../../../features/invitation-builder/components/identity-form",
	() => ({
		IdentityForm: () => null,
	}),
);

import CreatePage from "./page";

function mockThemeLookup(data: { slug: string } | null, error: unknown = null) {
	const query = {
		eq: vi.fn(),
		maybeSingle: vi.fn().mockResolvedValue({ data, error }),
	};
	query.eq.mockReturnValue(query);
	mocks.createClient.mockResolvedValue({
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue(query),
		}),
	});
	return query;
}

describe("create theme route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders only an active theme resolved on the server", async () => {
		const query = mockThemeLookup({ slug: "elegant-green" });
		const page = await CreatePage({
			params: Promise.resolve({ themeSlug: "elegant-green" }),
		});

		expect(page).toBeTruthy();
		expect(query.eq).toHaveBeenCalledWith("slug", "elegant-green");
		expect(query.eq).toHaveBeenCalledWith("is_active", true);
		expect(mocks.notFound).not.toHaveBeenCalled();
	});

	it("rejects an inactive or unknown theme", async () => {
		mockThemeLookup(null);

		await expect(
			CreatePage({ params: Promise.resolve({ themeSlug: "inactive-theme" }) }),
		).rejects.toThrow("not-found");
	});

	it("rejects malformed theme slugs before database access", async () => {
		await expect(
			CreatePage({ params: Promise.resolve({ themeSlug: "Invalid Theme" }) }),
		).rejects.toThrow("not-found");
		expect(mocks.createClient).not.toHaveBeenCalled();
	});
});
