import { z } from "zod";

export const step1IdentitySchema = z.object({
	slug: z
		.string()
		.min(3, "Slug minimal 3 karakter.")
		.max(50, "Slug maksimal 50 karakter.")
		.regex(
			/^[a-z0-9-]+$/,
			"Slug hanya boleh berisi huruf kecil, angka, dan strip.",
		),
	groom_name: z.string().min(1, "Nama panggilan mempelai pria wajib diisi."),
	groom_father_name: z.string().optional(),
	groom_mother_name: z.string().optional(),
	bride_name: z.string().min(1, "Nama panggilan mempelai wanita wajib diisi."),
	bride_father_name: z.string().optional(),
	bride_mother_name: z.string().optional(),
	opening_greeting: z.string().optional(),
	prayer_text: z.string().optional(),
});

export type Step1IdentityInput = z.infer<typeof step1IdentitySchema>;
