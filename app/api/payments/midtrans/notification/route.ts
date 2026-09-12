import { z } from "zod";
import { parseMidtransIdrAmount } from "../../../../../lib/midtrans/amount";
import {
	getMidtransTransactionStatus,
	type MidtransStatusResponse,
} from "../../../../../lib/midtrans/client";
import { getMidtransConfig } from "../../../../../lib/midtrans/config";
import { verifyMidtransSignature } from "../../../../../lib/midtrans/signature";
import {
	mapMidtransStatus,
	parseMidtransTime,
} from "../../../../../lib/midtrans/status";
import { createAdminClient } from "../../../../../lib/supabase/admin";

const notificationSchema = z
	.object({
		order_id: z.string().min(1).max(50),
		status_code: z.string().min(1).max(3),
		gross_amount: z.string().min(1).max(64),
		transaction_status: z.string().min(1).max(32),
		signature_key: z.string().length(128),
		payment_type: z.string().max(64).optional(),
		fraud_status: z.string().max(32).optional(),
		transaction_time: z.string().optional(),
		settlement_time: z.string().optional(),
	})
	.passthrough();

export async function POST(request: Request) {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return Response.json({ ok: false }, { status: 400 });
	}
	const parsed = notificationSchema.safeParse(payload);
	if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
	const config = getMidtransConfig();
	if (
		!verifyMidtransSignature({
			orderId: parsed.data.order_id,
			statusCode: parsed.data.status_code,
			grossAmount: parsed.data.gross_amount,
			signatureKey: parsed.data.signature_key,
			serverKey: config.serverKey,
		})
	)
		return Response.json({ ok: false }, { status: 401 });

	let verified: MidtransStatusResponse;
	try {
		verified = await getMidtransTransactionStatus(parsed.data.order_id);
	} catch {
		return Response.json({ ok: false }, { status: 503 });
	}
	if (verified.order_id !== parsed.data.order_id)
		return Response.json({ ok: false }, { status: 400 });
	let amount: bigint;
	try {
		amount = parseMidtransIdrAmount(verified.gross_amount);
		if (amount !== parseMidtransIdrAmount(parsed.data.gross_amount))
			throw new Error();
	} catch {
		return Response.json({ ok: false }, { status: 400 });
	}
	const targetStatus = mapMidtransStatus({
		transactionStatus: verified.transaction_status,
		statusCode: verified.status_code,
		fraudStatus: verified.fraud_status,
	});
	if (!targetStatus) return Response.json({ ok: true });
	const paidAt =
		targetStatus === "paid"
			? (parseMidtransTime(
					verified.transaction_status === "settlement"
						? verified.settlement_time
						: verified.transaction_time,
				) ?? new Date().toISOString())
			: null;
	const { error } = await createAdminClient().rpc(
		"apply_verified_midtrans_payment",
		{
			p_order_id: verified.order_id,
			p_target_status: targetStatus,
			p_gross_amount: amount.toString(),
			p_payment_type: verified.payment_type ?? null,
			p_paid_at: paidAt,
		},
	);
	if (error) {
		const status = error.message.includes("amount_mismatch") ? 400 : 503;
		return Response.json({ ok: false }, { status });
	}
	return Response.json({ ok: true });
}
