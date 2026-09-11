import { describe, expect, it } from "vitest";
import {
	MAX_IMAGE_INPUT_BYTES,
	MAX_IMAGE_OUTPUT_BYTES,
	validateImageInput,
	validateOptimizedImageBlob,
} from "./image";

describe("image input validation", () => {
	it("accepts an image up to 10 MB", () => {
		expect(() =>
			validateImageInput({ size: MAX_IMAGE_INPUT_BYTES, type: "image/jpeg" }),
		).not.toThrow();
	});

	it("rejects an initial image larger than 10 MB", () => {
		expect(() =>
			validateImageInput({
				size: MAX_IMAGE_INPUT_BYTES + 1,
				type: "image/png",
			}),
		).toThrow("maksimal 10 MB");
	});

	it("rejects a non-image input", () => {
		expect(() =>
			validateImageInput({ size: 100, type: "application/pdf" }),
		).toThrow("harus berupa gambar");
	});
});

describe("optimized image output validation", () => {
	it("accepts WebP output at exactly 500 KiB", () => {
		expect(() =>
			validateOptimizedImageBlob({
				size: MAX_IMAGE_OUTPUT_BYTES,
				type: "image/webp",
			}),
		).not.toThrow();
	});

	it("rejects a browser format fallback", () => {
		expect(() =>
			validateOptimizedImageBlob({ size: 100, type: "image/png" }),
		).toThrow("format WebP");
	});

	it("rejects optimized output above 500 KiB", () => {
		expect(() =>
			validateOptimizedImageBlob({
				size: MAX_IMAGE_OUTPUT_BYTES + 1,
				type: "image/webp",
			}),
		).toThrow("melebihi 500 KB");
	});
});
