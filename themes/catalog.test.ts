import { describe, expect, it } from "vitest";
import { getThemeBySlug } from "./catalog";

describe("theme catalog", () => {
	it("resolves a public theme slug to an internal renderer key", () => {
		expect(getThemeBySlug("elegant-green")).toMatchObject({
			slug: "elegant-green",
			rendererKey: "elegant-green",
		});
	});

	it("rejects an unknown public theme slug", () => {
		expect(getThemeBySlug("unknown-theme")).toBeNull();
	});
});
