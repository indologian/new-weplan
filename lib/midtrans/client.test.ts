import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./config", () => ({
	getMidtransConfig: () => ({
		serverKey: "server-secret",
		clientKey: "client-key",
		snapUrl: "https://snap.example/transactions",
		statusUrl: "https://status.example/v2",
		snapScriptUrl: "https://snap.example/snap.js",
	}),
}));

import { createSnapTransaction, getMidtransTransactionStatus } from "./client";

describe("Midtrans HTTP client", () => {
	beforeEach(() => vi.restoreAllMocks());

	it("creates Snap using the reserved order and snapshot amount", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				new Response(JSON.stringify({ token: "snap-token" }), { status: 201 }),
			);
		await expect(
			createSnapTransaction("weplan-order", 10000n),
		).resolves.toEqual({
			token: "snap-token",
			clientKey: "client-key",
			snapScriptUrl: "https://snap.example/snap.js",
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("https://snap.example/transactions");
		expect(JSON.parse(String(init?.body))).toEqual({
			transaction_details: { order_id: "weplan-order", gross_amount: 10000 },
		});
	});

	it("rejects malformed Snap responses", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({}), { status: 201 }),
		);
		await expect(createSnapTransaction("weplan-order", 10000n)).rejects.toThrow(
			"tidak valid",
		);
	});

	it("loads transaction status through the status endpoint", async () => {
		const response = {
			order_id: "weplan-order",
			status_code: "200",
			gross_amount: "10000.00",
			transaction_status: "settlement",
		};
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				new Response(JSON.stringify(response), { status: 200 }),
			);
		await expect(getMidtransTransactionStatus("weplan-order")).resolves.toEqual(
			response,
		);
		expect(fetchMock.mock.calls[0][0]).toBe(
			"https://status.example/v2/weplan-order/status",
		);
	});
});
