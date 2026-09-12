export const knownMidtransStatuses = [
	"pending",
	"capture",
	"settlement",
	"deny",
	"failure",
	"expire",
	"cancel",
] as const;

export type KnownMidtransStatus = (typeof knownMidtransStatuses)[number];
export type InternalPaymentStatus =
	| "pending"
	| "paid"
	| "failed"
	| "expired"
	| "cancelled";

export function mapMidtransStatus(input: {
	transactionStatus: string;
	statusCode: string;
	fraudStatus?: string;
}): InternalPaymentStatus | null {
	switch (input.transactionStatus) {
		case "pending":
			return "pending";
		case "capture":
		case "settlement":
			return input.statusCode === "200" &&
				(!input.fraudStatus || input.fraudStatus === "accept")
				? "paid"
				: null;
		case "deny":
		case "failure":
			return "failed";
		case "expire":
			return "expired";
		case "cancel":
			return "cancelled";
		default:
			return null;
	}
}

export function parseMidtransTime(value: string | undefined): string | null {
	if (!value) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
	if (!match) return null;
	const parsed = new Date(
		`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+07:00`,
	);
	return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}
