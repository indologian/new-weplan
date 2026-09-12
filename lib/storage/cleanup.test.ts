import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
	requireAuthenticatedMutation: vi.fn(),
	createAdminClient: vi.fn(),
}));
vi.mock("../auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));
vi.mock("../supabase/admin", () => ({
	createAdminClient: mocks.createAdminClient,
}));

import { authorizeCanonicalAssetPath } from "./authorized-assets";
import {
	cleanupAuthorizedAssets,
	cleanupOwnedInvitationAssets,
	cleanupTrustedInvitationAssets,
} from "./cleanup";

const context = {
	userId: "00000000-0000-4000-8000-000000000010",
	invitationId: "00000000-0000-4000-8000-000000000100",
};
const paths = ["cover/cover.webp", "couple/groom.webp"].map((suffix) =>
	authorizeCanonicalAssetPath(
		context,
		`${context.userId}/${context.invitationId}/${suffix}`,
	),
);

function createStorage(existing: Set<string>, failed = new Set<string>()) {
	return {
		info: vi.fn(async (path: string) =>
			existing.has(path)
				? { data: { id: path }, error: null }
				: { data: null, error: { status: 404 } },
		),
		remove: vi.fn(async ([path]: string[]) => {
			if (failed.has(path))
				return { data: null, error: { message: "network" } };
			existing.delete(path);
			return { data: [], error: null };
		}),
	} as never;
}

describe("canonical asset cleanup", () => {
	it("is idempotent when an object is already absent", async () => {
		const result = await cleanupAuthorizedAssets(createStorage(new Set()), [
			paths[0],
		]);
		expect(result).toMatchObject({
			outcome: "already-absent",
			alreadyAbsent: [paths[0]],
			failed: [],
		});
	});

	it("is retry-safe after a successful cleanup", async () => {
		const existing = new Set<string>([paths[0]]);
		const storage = createStorage(existing);
		expect((await cleanupAuthorizedAssets(storage, [paths[0]])).outcome).toBe(
			"complete",
		);
		expect((await cleanupAuthorizedAssets(storage, [paths[0]])).outcome).toBe(
			"already-absent",
		);
	});

	it("reports partial failures without hiding successful deletes", async () => {
		const existing = new Set<string>(paths);
		const result = await cleanupAuthorizedAssets(
			createStorage(existing, new Set([paths[1]])),
			paths,
		);
		expect(result.outcome).toBe("partial-failure");
		expect(result.deleted).toEqual([paths[0]]);
		expect(result.failed).toEqual([
			{ path: paths[1], message: "Storage operation failed" },
		]);
	});

	it("rejects foreign invitation cleanup before privileged Storage access", async () => {
		const query = {
			eq: vi.fn(),
			maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
		};
		query.eq.mockReturnValue(query);
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			userId: context.userId,
			supabase: { from: () => ({ select: () => query }) },
		});

		await expect(
			cleanupOwnedInvitationAssets("00000000-0000-4000-8000-000000000200"),
		).rejects.toThrow("Tidak memiliki akses");
		expect(mocks.createAdminClient).not.toHaveBeenCalled();
	});

	it("enumerates a trusted invitation snapshot before deleting canonical objects", async () => {
		const objectPath = `${context.userId}/${context.invitationId}/cover/cover.webp`;
		const existing = new Set([objectPath]);
		const storage = {
			list: vi.fn(async (folder: string) => {
				if (folder === `${context.userId}/${context.invitationId}`) {
					return { data: [{ id: null, name: "cover" }], error: null };
				}
				return { data: [{ id: "object-id", name: "cover.webp" }], error: null };
			}),
			info: vi.fn(async (path: string) => ({
				data: existing.has(path) ? { id: "object-id" } : null,
				error: existing.has(path) ? null : { status: 404 },
			})),
			remove: vi.fn(async ([path]: string[]) => {
				existing.delete(path);
				return { data: [], error: null };
			}),
		};
		mocks.createAdminClient.mockReturnValue({
			storage: { from: () => storage },
		});

		await expect(
			cleanupTrustedInvitationAssets(context.userId, context.invitationId),
		).resolves.toMatchObject({ outcome: "complete", deleted: [objectPath] });
		expect(storage.list).toHaveBeenCalledTimes(2);
		expect(storage.remove).toHaveBeenCalledWith([objectPath]);
	});

	it("marks bounded traversal incomplete without deleting the invitation context", async () => {
		const storage = {
			list: vi.fn(async () => ({
				data: [{ id: null, name: "nested" }],
				error: null,
			})),
			remove: vi.fn(async () => ({ data: [], error: null })),
		};
		mocks.createAdminClient.mockReturnValue({
			storage: { from: () => storage },
		});

		const result = await cleanupTrustedInvitationAssets(
			context.userId,
			context.invitationId,
			{ maxListRequests: 1, maxBulkDeletePaths: 1000 },
		);

		expect(result).toMatchObject({
			outcome: "incomplete",
			traversalComplete: false,
			listRequests: 1,
		});
		expect(storage.list).toHaveBeenCalledTimes(1);
		expect(storage.remove).not.toHaveBeenCalled();
	});
});
