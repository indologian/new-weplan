import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const snap = vi.fn();
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: vi.fn(async () => ({
		supabase: { rpc },
		userId: "owner",
	})),
}));
vi.mock("../../lib/midtrans/client", () => ({
	createSnapTransaction: (...args: unknown[]) => snap(...args),
}));

import { startPaymentCheckout } from "./checkout";

describe("startPaymentCheckout", () => {
	beforeEach(() => {
		rpc.mockReset();
		snap.mockReset();
	});
	it("accepts only invitationId and uses reserved amount/order", async () => {
		rpc.mockResolvedValueOnce({
			data: [{ midtrans_order_id: "weplan-order", gross_amount: "10000" }],
			error: null,
		});
		snap.mockResolvedValue({
			token: "token",
			clientKey: "client",
			snapScriptUrl: "https://snap",
		});
		await expect(
			startPaymentCheckout({
				invitationId: "11111111-1111-4111-8111-111111111111",
			}),
		).resolves.toMatchObject({ orderId: "weplan-order" });
		expect(snap).toHaveBeenCalledWith("weplan-order", 10000n);
	});
	it("rejects unrelated authoritative fields", async () => {
		await expect(
			startPaymentCheckout({
				invitationId: "11111111-1111-4111-8111-111111111111",
				price: 1,
			}),
		).rejects.toThrow("tidak valid");
	});
	it("compensates a failed Snap creation", async () => {
		rpc.mockResolvedValueOnce({
			data: [{ midtrans_order_id: "weplan-order", gross_amount: "10000" }],
			error: null,
		});
		rpc.mockResolvedValueOnce({ data: null, error: null });
		snap.mockRejectedValue(new Error("network"));
		await expect(
			startPaymentCheckout({
				invitationId: "11111111-1111-4111-8111-111111111111",
			}),
		).rejects.toThrow("Silakan coba");
		expect(rpc).toHaveBeenLastCalledWith("compensate_payment_checkout", {
			p_midtrans_order_id: "weplan-order",
		});
	});
});
