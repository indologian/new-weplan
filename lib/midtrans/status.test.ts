import { describe, expect, it } from "vitest";
import { mapMidtransStatus, parseMidtransTime } from "./status";

describe("Midtrans status mapping", () => {
	it.each([
		["pending", "201", undefined, "pending"],
		["capture", "200", "accept", "paid"],
		["settlement", "200", undefined, "paid"],
		["deny", "202", undefined, "failed"],
		["failure", "500", undefined, "failed"],
		["expire", "202", undefined, "expired"],
		["cancel", "202", undefined, "cancelled"],
		["refund", "200", undefined, null],
	])("maps %s", (transactionStatus, statusCode, fraudStatus, expected) => {
		expect(
			mapMidtransStatus({ transactionStatus, statusCode, fraudStatus }),
		).toBe(expected);
	});
	it("rejects unsuccessful capture", () => {
		expect(
			mapMidtransStatus({
				transactionStatus: "capture",
				statusCode: "200",
				fraudStatus: "deny",
			}),
		).toBeNull();
	});
	it("parses Midtrans GMT+7 timestamps", () => {
		expect(parseMidtransTime("2026-09-12 12:00:00")).toBe(
			"2026-09-12T05:00:00.000Z",
		);
	});
});
