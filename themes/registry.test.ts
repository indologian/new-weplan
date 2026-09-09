import { describe, expect, it } from "vitest";
import { ElegantGreenTheme } from "./elegant-green";
import { getThemeRenderer } from "./registry";

describe("theme renderer registry", () => {
	it("resolves an allowlisted renderer key", () => {
		expect(getThemeRenderer("elegant-green")).toBe(ElegantGreenTheme);
	});

	it("rejects an unknown renderer key", () => {
		expect(getThemeRenderer("unknown-renderer")).toBeNull();
	});
});
