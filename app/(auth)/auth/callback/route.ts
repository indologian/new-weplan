import { type NextRequest, NextResponse } from "next/server";
import { ensureCoupleProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const loginUrl = new URL("/login", request.url);

	if (!code) {
		loginUrl.searchParams.set("error", "Kode OAuth tidak tersedia.");
		return NextResponse.redirect(loginUrl);
	}

	const supabase = await createClient();
	const { data, error } = await supabase.auth.exchangeCodeForSession(code);

	if (error || !data.user) {
		loginUrl.searchParams.set("error", "Sesi Google tidak dapat dibuat.");
		return NextResponse.redirect(loginUrl);
	}

	try {
		await ensureCoupleProfile(data.user);
	} catch {
		await supabase.auth.signOut();
		loginUrl.searchParams.set("error", "Profil akun tidak dapat disiapkan.");
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.redirect(new URL("/dashboard", request.url));
}
