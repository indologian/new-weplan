import { describe, expect, it } from "vitest";
import { authorizeCronRequest } from "./cron-authorization";

describe("cron authorization", () => {
	it("accepts only the exact Bearer secret", async () => {
		await expect(
			authorizeCronRequest("Bearer expected", "expected"),
		).resolves.toBe(true);
		await expect(
			authorizeCronRequest("Bearer wrong", "expected"),
		).resolves.toBe(false);
	});

	it.each([null, "", "Basic expected", "Bearer "])(
		"rejects %s",
		async (value) => {
			await expect(authorizeCronRequest(value, "expected")).resolves.toBe(
				false,
			);
		},
	);

	it("fails closed when CRON_SECRET is missing", async () => {
		await expect(
			authorizeCronRequest("Bearer expected", undefined),
		).resolves.toBe(false);
	});
});
