import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../auth/authorization", () => ({
	requireAuthenticatedMutation: vi.fn(),
}));

import { authorizeCanonicalAssetPath } from "./authorized-assets";
import {
	maxOptimizedImageBytes,
	requireStoredOptimizedImage,
} from "./image-metadata";

const context = {
	userId: "00000000-0000-4000-8000-000000000010",
	invitationId: "00000000-0000-4000-8000-000000000100",
};
const path = authorizeCanonicalAssetPath(
	context,
	`${context.userId}/${context.invitationId}/cover/cover.webp`,
);

function storage(data: unknown, error: unknown = null) {
	return {
		info: vi.fn().mockResolvedValue({ data, error }),
	} as never;
}

describe("optimized image Storage metadata", () => {
	it("accepts present WebP metadata at exactly 500 KiB", async () => {
		await expect(
			requireStoredOptimizedImage(
				storage({ size: maxOptimizedImageBytes, contentType: "image/webp" }),
				path,
			),
		).resolves.toMatchObject({ path, contentType: "image/webp" });
	});

	it("rejects a missing object", async () => {
		await expect(
			requireStoredOptimizedImage(storage(null, { status: 404 }), path),
		).rejects.toThrow("belum berhasil diunggah");
	});

	it("rejects wrong stored MIME metadata", async () => {
		await expect(
			requireStoredOptimizedImage(
				storage({ size: 100, contentType: "image/png" }),
				path,
			),
		).rejects.toThrow("Format gambar tersimpan");
	});

	it("rejects stored optimized images above 500 KiB", async () => {
		await expect(
			requireStoredOptimizedImage(
				storage({
					size: maxOptimizedImageBytes + 1,
					contentType: "image/webp",
				}),
				path,
			),
		).rejects.toThrow("melebihi 500 KB");
	});
});
