import { describe, expect, it } from "vitest";
import { createMidtransSignature, verifyMidtransSignature } from "./signature";

describe("Midtrans signature", () => {
	it("accepts exact signed fields and rejects tampering", () => {
		const signatureKey = createMidtransSignature(
			"order-1",
			"200",
			"10000.00",
			"secret",
		);
		expect(
			verifyMidtransSignature({
				orderId: "order-1",
				statusCode: "200",
				grossAmount: "10000.00",
				signatureKey,
				serverKey: "secret",
			}),
		).toBe(true);
		expect(
			verifyMidtransSignature({
				orderId: "order-1",
				statusCode: "200",
				grossAmount: "10001.00",
				signatureKey,
				serverKey: "secret",
			}),
		).toBe(false);
	});
});
