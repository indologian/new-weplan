import { describe, expect, it } from "vitest";
import {
	giftAccountContentSchema,
	reorderGiftAccountsSchema,
} from "./gift-account";

describe("gift account validation", () => {
	it("trims surrounding whitespace while preserving leading zeroes", () => {
		expect(
			giftAccountContentSchema.parse({
				bankName: "  Bank Contoh  ",
				accountNumber: "  001234567890  ",
				accountHolder: "  Budi  ",
			}),
		).toEqual({
			bankName: "Bank Contoh",
			accountNumber: "001234567890",
			accountHolder: "Budi",
		});
	});

	it.each(["bankName", "accountNumber", "accountHolder"])(
		"rejects a missing %s",
		(field) => {
			const input = {
				bankName: "Bank Contoh",
				accountNumber: "001234567890",
				accountHolder: "Budi",
				[field]: "   ",
			};
			expect(giftAccountContentSchema.safeParse(input).success).toBe(false);
		},
	);

	it("rejects duplicate reorder IDs", () => {
		const id = "00000000-0000-4000-8000-000000000001";
		expect(reorderGiftAccountsSchema.safeParse([id, id]).success).toBe(false);
	});
});
