"use server";

import { z } from "zod";
import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { createSnapTransaction } from "../../lib/midtrans/client";

const checkoutInput = z.object({ invitationId: z.string().uuid() }).strict();

export async function startPaymentCheckout(input: unknown) {
	const parsed = checkoutInput.safeParse(input);
	if (!parsed.success) throw new Error("Permintaan checkout tidak valid.");
	const { supabase } = await requireAuthenticatedMutation();
	const { data, error } = await supabase.rpc("reserve_payment_checkout", {
		p_invitation_id: parsed.data.invitationId,
	});
	const reservation = data?.[0];
	if (error || !reservation)
		throw new Error("Undangan belum dapat diproses untuk pembayaran.");
	try {
		const snap = await createSnapTransaction(
			String(reservation.midtrans_order_id),
			BigInt(reservation.gross_amount),
		);
		return { ...snap, orderId: String(reservation.midtrans_order_id) };
	} catch {
		await supabase.rpc("compensate_payment_checkout", {
			p_midtrans_order_id: String(reservation.midtrans_order_id),
		});
		throw new Error("Checkout belum dapat dibuat. Silakan coba kembali.");
	}
}
