import { describe, expect, it } from "vitest";
import { parseMidtransIdrAmount } from "./amount";

describe("parseMidtransIdrAmount", () => {
	it.each([
		["10000", 10000n],
		["10000.00", 10000n],
		["0.0", 0n],
	])("parses %s losslessly", (value, expected) => {
		expect(parseMidtransIdrAmount(value)).toBe(expected);
	});
	it.each(["-1", "1.50", "1e4", "01", "x", "100.000"])(
		"rejects %s",
		(value) => {
			expect(() => parseMidtransIdrAmount(value)).toThrow();
		},
	);
});
