"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureCoupleProfile } from "../../lib/auth/profile";
import {
	type AuthActionState,
	firstValidationError,
	loginSchema,
	registerSchema,
} from "../../lib/auth/schemas";
import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { createClient } from "../../lib/supabase/server";

export async function loginAction(
	_previousState: AuthActionState,
	formData: FormData,
): Promise<AuthActionState> {
	const parsed = loginSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!parsed.success) {
		return { error: firstValidationError(parsed.error) };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword(parsed.data);

	if (error) {
		return { error: "Email atau kata sandi tidak valid." };
	}

	redirect("/dashboard");
}

export async function registerAction(
	_previousState: AuthActionState,
	formData: FormData,
): Promise<AuthActionState> {
	const parsed = registerSchema.safeParse({
		fullName: formData.get("fullName"),
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!parsed.success) {
		return { error: firstValidationError(parsed.error) };
	}

	const supabase = await createClient();
	const { data, error } = await supabase.auth.signUp({
		email: parsed.data.email,
		password: parsed.data.password,
		options: {
			data: { full_name: parsed.data.fullName },
		},
	});

	if (error || !data.user) {
		return { error: "Pendaftaran tidak dapat diproses." };
	}

	if (data.user.identities && data.user.identities.length === 0) {
		return { message: "Jika alamat tersebut dapat didaftarkan, periksa email Anda." };
	}

	try {
		await ensureCoupleProfile(data.user, parsed.data.fullName);
	} catch {
		return { error: "Akun dibuat, tetapi profil belum dapat disiapkan." };
	}

	if (data.session) {
		redirect("/dashboard");
	}

	return { message: "Pendaftaran berhasil. Periksa email untuk konfirmasi akun." };
}

export async function googleOAuthAction(): Promise<void> {
	const requestHeaders = await headers();
	const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${origin}/auth/callback`,
		},
	});

	if (error || !data.url) {
		redirect("/login?error=Google%20OAuth%20tidak%20dapat%20dimulai.");
	}

	redirect(data.url);
}

export async function logoutAction(): Promise<void> {
	const { supabase } = await requireAuthenticatedMutation();
	await supabase.auth.signOut();
	redirect("/login");
}
