import { createHash, timingSafeEqual } from "node:crypto";

export function createMidtransSignature(
	orderId: string,
	statusCode: string,
	grossAmount: string,
	serverKey: string,
) {
	return createHash("sha512")
		.update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
		.digest("hex");
}

export function verifyMidtransSignature(input: {
	orderId: string;
	statusCode: string;
	grossAmount: string;
	signatureKey: string;
	serverKey: string;
}) {
	const expected = Buffer.from(
		createMidtransSignature(
			input.orderId,
			input.statusCode,
			input.grossAmount,
			input.serverKey,
		),
		"utf8",
	);
	const actual = Buffer.from(input.signatureKey.toLowerCase(), "utf8");
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}
