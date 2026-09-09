import { z } from "zod";

export const loginSchema = z.object({
	email: z.email("Masukkan alamat email yang valid."),
	password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});

export const registerSchema = loginSchema.extend({
	fullName: z.string().trim().min(1, "Nama lengkap wajib diisi."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type AuthActionState = {
	error?: string;
	message?: string;
};

export const initialAuthActionState: AuthActionState = {};

export function firstValidationError(error: z.ZodError): string {
	return error.issues[0]?.message ?? "Data autentikasi tidak valid.";
}
