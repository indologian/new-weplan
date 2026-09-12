import { beforeEach, describe, expect, it, vi } from "vitest";

const status = vi.fn();
const rpc = vi.fn();
const verify = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("../../../../../lib/midtrans/config", () => ({
	getMidtransConfig: () => ({ serverKey: "server" }),
}));
vi.mock("../../../../../lib/midtrans/signature", () => ({
	verifyMidtransSignature: (...args: unknown[]) => verify(...args),
}));
vi.mock("../../../../../lib/midtrans/client", () => ({
	getMidtransTransactionStatus: (...args: unknown[]) => status(...args),
}));
vi.mock("../../../../../lib/supabase/admin", () => ({
	createAdminClient: () => ({ rpc }),
}));

import { POST } from "./route";

const payload = {
	order_id: "weplan-order",
	status_code: "200",
	gross_amount: "10000.00",
	transaction_status: "settlement",
	signature_key: "a".repeat(128),
};

function request(body: unknown) {
	return new Request("http://localhost/api/payments/midtrans/notification", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("Midtrans notification", () => {
	beforeEach(() => {
		status.mockReset();
		rpc.mockReset();
		verify.mockReset();
	});
	it("rejects malformed notifications", async () => {
		expect((await POST(request({ order_id: "x" }))).status).toBe(400);
	});
	it("rejects invalid signatures before status lookup", async () => {
		verify.mockReturnValue(false);
		expect((await POST(request(payload))).status).toBe(401);
		expect(status).not.toHaveBeenCalled();
	});
	it("returns retryable failure when status verification is unavailable", async () => {
		verify.mockReturnValue(true);
		status.mockRejectedValue(new Error("temporary"));
		expect((await POST(request(payload))).status).toBe(503);
		expect(rpc).not.toHaveBeenCalled();
	});
	it("passes only verified normalized facts to the atomic RPC", async () => {
		verify.mockReturnValue(true);
		status.mockResolvedValue({
			...payload,
			payment_type: "bank_transfer",
			settlement_time: "2026-09-12 12:00:00",
		});
		rpc.mockResolvedValue({ data: "applied", error: null });
		expect((await POST(request(payload))).status).toBe(200);
		expect(rpc).toHaveBeenCalledWith("apply_verified_midtrans_payment", {
			p_order_id: "weplan-order",
			p_target_status: "paid",
			p_gross_amount: "10000",
			p_payment_type: "bank_transfer",
			p_paid_at: "2026-09-12T05:00:00.000Z",
		});
	});
	it("does not mutate unknown Midtrans states", async () => {
		verify.mockReturnValue(true);
		status.mockResolvedValue({ ...payload, transaction_status: "refund" });
		expect((await POST(request(payload))).status).toBe(200);
		expect(rpc).not.toHaveBeenCalled();
	});
});
