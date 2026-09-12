import "server-only";
import { getMidtransConfig } from "./config";

export type MidtransStatusResponse = {
	order_id: string;
	status_code: string;
	gross_amount: string;
	transaction_status: string;
	payment_type?: string;
	fraud_status?: string;
	transaction_time?: string;
	settlement_time?: string;
};

async function midtransFetch(
	url: string,
	init: RequestInit,
	serverKey: string,
) {
	return fetch(url, {
		...init,
		headers: {
			Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
			"Content-Type": "application/json",
			...init.headers,
		},
		signal: AbortSignal.timeout(10_000),
		cache: "no-store",
	});
}

export async function createSnapTransaction(
	orderId: string,
	grossAmount: bigint,
) {
	if (grossAmount < 0n || grossAmount > BigInt(Number.MAX_SAFE_INTEGER))
		throw new Error("Nominal pembayaran tidak valid.");
	const config = getMidtransConfig();
	const response = await midtransFetch(
		config.snapUrl,
		{
			method: "POST",
			body: JSON.stringify({
				transaction_details: {
					order_id: orderId,
					gross_amount: Number(grossAmount),
				},
			}),
		},
		config.serverKey,
	);
	if (!response.ok) throw new Error("Midtrans menolak pembuatan transaksi.");
	const body: unknown = await response.json();
	if (
		!body ||
		typeof body !== "object" ||
		!("token" in body) ||
		typeof body.token !== "string" ||
		!body.token
	) {
		throw new Error("Respons Midtrans tidak valid.");
	}
	return {
		token: body.token,
		clientKey: config.clientKey,
		snapScriptUrl: config.snapScriptUrl,
	};
}

export async function getMidtransTransactionStatus(
	orderId: string,
): Promise<MidtransStatusResponse> {
	const config = getMidtransConfig();
	const response = await midtransFetch(
		`${config.statusUrl}/${encodeURIComponent(orderId)}/status`,
		{ method: "GET" },
		config.serverKey,
	);
	if (!response.ok)
		throw new Error("Status pembayaran belum dapat diverifikasi.");
	const body: unknown = await response.json();
	if (!body || typeof body !== "object")
		throw new Error("Respons status Midtrans tidak valid.");
	const value = body as Record<string, unknown>;
	for (const key of [
		"order_id",
		"status_code",
		"gross_amount",
		"transaction_status",
	]) {
		if (typeof value[key] !== "string")
			throw new Error("Respons status Midtrans tidak valid.");
	}
	return value as MidtransStatusResponse;
}
