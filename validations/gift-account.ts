import { z } from "zod";

export const giftInvitationIdSchema = z.string().uuid();
export const giftAccountIdSchema = z.string().uuid();

export const giftAccountContentSchema = z.object({
	bankName: z.string().trim().min(1, "Nama bank wajib diisi."),
	accountNumber: z.string().trim().min(1, "Nomor rekening wajib diisi."),
	accountHolder: z.string().trim().min(1, "Nama pemilik rekening wajib diisi."),
});

export const reorderGiftAccountsSchema = z
	.array(giftAccountIdSchema)
	.superRefine((ids, context) => {
		if (new Set(ids).size !== ids.length) {
			context.addIssue({ code: "custom", message: "ID rekening duplikat." });
		}
	});

export type GiftAccountContentInput = z.infer<typeof giftAccountContentSchema>;

export type GiftAccount = GiftAccountContentInput & {
	id: string;
	sortOrder: number;
};
