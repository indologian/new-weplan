import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../auth/authorization", () => ({
	requireAuthenticatedMutation: vi.fn(),
}));

import { signValidatedPublicInvitationAssets } from "./public-invitation-assets";

const ownerId = "00000000-0000-4000-8000-000000000010";
const invitationId = "00000000-0000-4000-8000-000000000100";

function context(path: string | null, signed = true) {
	const createSignedUrls = vi.fn().mockResolvedValue({
		data:
			signed && path ? [{ path, signedUrl: "https://signed.test/asset" }] : [],
		error: null,
	});
	return {
		createSignedUrls,
		input: {
			supabase: { storage: { from: () => ({ createSignedUrls }) } } as never,
			ownerId,
			invitation: {
				id: invitationId,
				coverPhotoPath: path,
				groomPhotoPath: null,
				bridePhotoPath: null,
				musicPath: null,
			},
			stories: [],
			gallery: [],
		},
	};
}

describe("public invitation signed assets", () => {
	it("signs a canonical private path for one hour", async () => {
		const path = `${ownerId}/${invitationId}/cover/cover.webp`;
		const test = context(path);
		await expect(
			signValidatedPublicInvitationAssets(test.input),
		).resolves.toEqual({ [path]: "https://signed.test/asset" });
		expect(test.createSignedUrls).toHaveBeenCalledWith([path], 3600);
	});
	it("fails closed for a noncanonical persisted relationship", async () => {
		const test = context(`${ownerId}/${invitationId}/gallery/arbitrary.webp`);
		await expect(
			signValidatedPublicInvitationAssets(test.input),
		).rejects.toThrow("tidak tersedia");
		expect(test.createSignedUrls).not.toHaveBeenCalled();
	});
	it("keeps optional missing signed assets absent", async () => {
		const path = `${ownerId}/${invitationId}/cover/cover.webp`;
		const test = context(path, false);
		await expect(
			signValidatedPublicInvitationAssets(test.input),
		).resolves.toEqual({});
	});
});
