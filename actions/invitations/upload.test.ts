import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuthenticatedMutation: vi.fn(),
}));

vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import { createUploadUrl, updateInvitationPhotoPath } from "./upload";

function createSupabase(options?: { owned?: boolean }) {
	const owned = options?.owned ?? true;
	const maybeSingle = vi.fn().mockResolvedValue({
		data: owned ? { id: "invitation-1" } : null,
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
				from: vi.fn().mockReturnValue({ createSignedUploadUrl }),
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
			userId: "owner-1",
		});

		await expect(createUploadUrl("invitation-2", "cover")).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(supabase.createSignedUploadUrl).not.toHaveBeenCalled();
	});

	it("rejects an invalid photo type", async () => {
		const supabase = createSupabase();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: supabase.client,
			userId: "owner-1",
		});

		await expect(createUploadUrl("invitation-1", "gallery")).rejects.toThrow(
			"Jenis foto tidak valid",
		);
		expect(supabase.createSignedUploadUrl).not.toHaveBeenCalled();
	});

	it("persists only the server-calculated canonical path", async () => {
		const supabase = createSupabase();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: supabase.client,
			userId: "owner-1",
		});

		await updateInvitationPhotoPath("invitation-1", "bride");

		expect(supabase.update).toHaveBeenCalledWith({
			bride_photo_path: "owner-1/invitation-1/couple/bride.webp",
		});
	});
});
