import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../auth/authorization", () => ({
	requireAuthenticatedMutation: vi.fn(),
}));

import { authorizeCanonicalAssetPath } from "./authorized-assets";

const context = {
	userId: "00000000-0000-4000-8000-000000000010",
	invitationId: "00000000-0000-4000-8000-000000000100",
};

describe("authorized invitation asset paths", () => {
	it("accepts a canonical path under the verified owner and invitation", () => {
		const path = `${context.userId}/${context.invitationId}/cover/cover.webp`;
		expect(authorizeCanonicalAssetPath(context, path)).toBe(path);
	});

	it.each([
		"arbitrary/path/cover/cover.webp",
		`${context.userId}/00000000-0000-4000-8000-000000000200/cover/cover.webp`,
		`${context.userId}/${context.invitationId}/../foreign.webp`,
		`${context.userId}/${context.invitationId}/cover\\foreign.webp`,
		`${context.userId}/${context.invitationId}/%2e%2e/foreign.webp`,
	])("rejects an arbitrary or noncanonical path: %s", (path) => {
		expect(() => authorizeCanonicalAssetPath(context, path)).toThrow(
			"Path asset undangan tidak valid",
		);
	});
});
