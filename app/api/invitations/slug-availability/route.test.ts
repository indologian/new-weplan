import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	createAdminClient: vi.fn(),
}));

vi.mock("../../../../lib/supabase/admin", () => ({
	createAdminClient: mocks.createAdminClient,
}));

import { GET } from "./route";

function mockLookup(data: { slug: string } | null, error: unknown = null) {
	const query = {
		eq: vi.fn(),
		limit: vi.fn(),
		maybeSingle: vi.fn().mockResolvedValue({ data, error }),
	};
	query.eq.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	const select = vi.fn().mockReturnValue(query);
	mocks.createAdminClient.mockReturnValue({
		from: vi.fn().mockReturnValue({ select }),
	});
	return { query, select };
}

describe("GET slug availability", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns available without exposing database metadata", async () => {
		const lookup = mockLookup(null);
		const response = await GET(
			new NextRequest(
				"https://weplan.test/api/invitations/slug-availability?slug=andi-siti",
			),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			slug: "andi-siti",
			available: true,
		});
		expect(lookup.select).toHaveBeenCalledWith("slug");
	});

	it("returns unavailable when the global slug exists", async () => {
		mockLookup({ slug: "andi-siti" });
		const response = await GET(
			new NextRequest(
				"https://weplan.test/api/invitations/slug-availability?slug=andi-siti",
			),
		);

		expect(await response.json()).toEqual({
			slug: "andi-siti",
			available: false,
		});
	});

	it("rejects an invalid slug before creating the privileged client", async () => {
		const response = await GET(
			new NextRequest(
				"https://weplan.test/api/invitations/slug-availability?slug=Invalid%20Slug",
			),
		);

		expect(response.status).toBe(400);
		expect(mocks.createAdminClient).not.toHaveBeenCalled();
	});
});
