import "server-only";

export type MidtransConfig = {
	serverKey: string;
	clientKey: string;
	snapUrl: string;
	statusUrl: string;
	snapScriptUrl: string;
};

export function getMidtransConfig(
	env: Record<string, string | undefined> = process.env,
): MidtransConfig {
	const serverKey = env.MIDTRANS_SERVER_KEY?.trim();
	const clientKey = env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim();
	if (!serverKey || !clientKey)
		throw new Error("Konfigurasi pembayaran belum lengkap.");
	const production = env.MIDTRANS_IS_PRODUCTION === "true";
	return {
		serverKey,
		clientKey,
		snapUrl: production
			? "https://app.midtrans.com/snap/v1/transactions"
			: "https://app.sandbox.midtrans.com/snap/v1/transactions",
		statusUrl: production
			? "https://api.midtrans.com/v2"
			: "https://api.sandbox.midtrans.com/v2",
		snapScriptUrl: production
			? "https://app.midtrans.com/snap/snap.js"
			: "https://app.sandbox.midtrans.com/snap/snap.js",
	};
}
