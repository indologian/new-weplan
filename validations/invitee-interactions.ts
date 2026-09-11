import { z } from "zod";

export const inviteeTokenSchema = z
	.string()
	.regex(/^[A-Za-z0-9_-]{43}$/, "Tautan undangan tidak valid.");

export const rsvpRequestSchema = z
	.object({
		attendance: z.enum(["attending", "not_attending"]),
		guestCount: z.number().int(),
	})
	.strict()
	.superRefine((value, context) => {
		if (value.attendance === "attending" && value.guestCount < 1) {
			context.addIssue({
				code: "custom",
				path: ["guestCount"],
				message: "Jumlah tamu minimal satu.",
			});
		}
	})
	.transform((value) => ({
		attendance: value.attendance,
		guestCount: value.attendance === "not_attending" ? 0 : value.guestCount,
	}));

export const wishRequestSchema = z
	.object({
		message: z
			.string()
			.transform((message) => message.trim())
			.refine((message) => [...message].length >= 1, "Ucapan wajib diisi.")
			.refine(
				(message) => [...message].length <= 500,
				"Ucapan maksimal 500 karakter.",
			),
	})
	.strict();

export type RsvpRequest = z.output<typeof rsvpRequestSchema>;
export type WishRequest = z.output<typeof wishRequestSchema>;
