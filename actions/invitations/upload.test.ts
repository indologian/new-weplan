import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
	requireAuthenticatedMutation: vi.fn(),
}));

vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import { createUploadUrl, updateInvitationPhotoPath } from "./upload";

const ownerId = "00000000-0000-4000-8000-000000000010";
const invitationId = "00000000-0000-4000-8000-000000000100";
const foreignInvitationId = "00000000-0000-4000-8000-000000000200";

function createSupabase(options?: { owned?: boolean }) {
	const owned = options?.owned ?? true;
	const maybeSingle = vi.fn().mockResolvedValue({
		data: owned ? { id: invitationId } : null,
		error: null,
	});
	const selectQuery = {
		eq: vi.fn(),
		maybeSingle,
	};
	selectQuery.eq.mockReturnValue(selectQuery);

	const updateQuery = {
		eq: vi.fn(),
	};
	updateQuery.eq
		.mockReturnValueOnce(updateQuery)
		.mockResolvedValueOnce({ error: null });

	const update = vi.fn().mockReturnValue(updateQuery);
	const createSignedUploadUrl = vi.fn().mockResolvedValue({
		data: { signedUrl: "https://storage.test/signed" },
		error: null,
	});
	const info = vi.fn().mockResolvedValue({
		data: { size: 100, contentType: "image/webp" },
		error: null,
	});
	const from = vi.fn((table: string) => {
		if (table === "invitations") {
			return { select: vi.fn().mockReturnValue(selectQuery), update };
		}
		throw new Error(`Unexpected table: ${table}`);
	});

	return {
		client: {
			from,
			storage: {
				from: vi.fn().mockReturnValue({ createSignedUploadUrl, info }),
			},
		},
		createSignedUploadUrl,
		update,
	};
}

describe("invitation photo upload actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rejects an invitation owned by another user", async () => {
		const supabase = createSupabase({ owned: false });
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: supabase.client,
			userId: ownerId,
		});

		await expect(createUploadUrl(foreignInvitationId, "cover")).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(supabase.createSignedUploadUrl).not.toHaveBeenCalled();
	});

	it("rejects an invalid photo type", async () => {
		const supabase = createSupabase();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: supabase.client,
			userId: ownerId,
		});

		await expect(createUploadUrl(invitationId, "gallery")).rejects.toThrow(
			"Jenis foto tidak valid",
		);
		expect(supabase.createSignedUploadUrl).not.toHaveBeenCalled();
	});

	it("persists only the server-calculated canonical path", async () => {
		const supabase = createSupabase();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: supabase.client,
			userId: ownerId,
		});

		await updateInvitationPhotoPath(invitationId, "bride");

		expect(supabase.update).toHaveBeenCalledWith({
			bride_photo_path: `${ownerId}/${invitationId}/couple/bride.webp`,
		});
	});

	it("rejects malformed invitation identifiers before signing", async () => {
		const supabase = createSupabase();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: supabase.client,
			userId: ownerId,
		});
		await expect(createUploadUrl("../foreign", "cover")).rejects.toThrow(
			"Undangan tidak valid",
		);
		expect(supabase.createSignedUploadUrl).not.toHaveBeenCalled();
	});
});
