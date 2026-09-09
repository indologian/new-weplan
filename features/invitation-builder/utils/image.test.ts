import { describe, expect, it } from "vitest";
import { MAX_IMAGE_INPUT_BYTES, validateImageInput } from "./image";

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
