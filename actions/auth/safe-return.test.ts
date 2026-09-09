import { describe, expect, it } from "vitest";
import { getSafeReturnPath } from "./safe-return";

describe("getSafeReturnPath", () => {
	it.each(["/dashboard", "/create/elegant-green"])(
		"accepts internal path %s",
		(path) => {
			expect(getSafeReturnPath(path)).toBe(path);
		},
	);

	it.each([
		"https://evil.com",
		"http://evil.com",
		"//evil.com",
		"/\\evil.com",
		"/%5Cevil.com",
		"/%255Cevil.com",
		"/%E0%A4%A",
	])("rejects unsafe return path %s", (path) => {
		expect(getSafeReturnPath(path)).toBe("/dashboard");
	});

	it("uses the requested fallback", () => {
		expect(getSafeReturnPath(null, "/login")).toBe("/login");
	});
});
