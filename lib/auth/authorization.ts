import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
	type AuthenticatedProfile,
	canAccessAdmin,
	claimsSubject,
	dashboardPathForRole,
} from "./access";

export const getAuthenticatedProfile = cache(
	async (): Promise<AuthenticatedProfile | null> => {
		const supabase = await createClient();
		const { data, error } = await supabase.auth.getClaims();
		const userId = error ? null : claimsSubject(data?.claims ?? null);

		if (!userId) {
			return null;
		}

		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("id, full_name, role")
			.eq("id", userId)
			.maybeSingle();

		if (profileError || !profile) {
			return null;
		}

		if (profile.role !== "couple" && profile.role !== "admin") {
			return null;
		}

		return {
			id: profile.id,
			fullName: profile.full_name,
			role: profile.role,
		};
	},
);

export async function requireAuthenticatedProfile(): Promise<AuthenticatedProfile> {
	const profile = await getAuthenticatedProfile();

	if (!profile) {
		redirect("/login");
	}

	return profile;
}

export async function requireAdminProfile(): Promise<AuthenticatedProfile> {
	const profile = await requireAuthenticatedProfile();

	if (!canAccessAdmin(profile)) {
		redirect("/dashboard/couple");
	}

	return profile;
}

export async function requireCoupleProfile(): Promise<AuthenticatedProfile> {
	const profile = await requireAuthenticatedProfile();

	if (profile.role !== "couple") {
		redirect(dashboardPathForRole(profile.role));
	}

	return profile;
}

export async function requireAuthenticatedMutation() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getClaims();
	const userId = error ? null : claimsSubject(data?.claims ?? null);

	if (!userId) {
		redirect("/login?error=Sesi%20tidak%20valid.");
	}

	return { supabase, userId };
}
