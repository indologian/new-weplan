const idrAmount = /^(0|[1-9]\d*)(?:\.0{1,2})?$/;

export function parseMidtransIdrAmount(value: string): bigint {
	if (!idrAmount.test(value))
		throw new Error("Nominal pembayaran tidak valid.");
	return BigInt(value.split(".")[0]);
}
