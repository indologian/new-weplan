export type ProfileRole = "couple" | "admin";

export type AuthenticatedProfile = {
	id: string;
	fullName: string;
	role: ProfileRole;
};

export function claimsSubject(
	claims: Record<string, unknown> | null,
): string | null {
	return typeof claims?.sub === "string" && claims.sub.length > 0
		? claims.sub
		: null;
}

export function canAccessAdmin(profile: AuthenticatedProfile | null): boolean {
	return profile?.role === "admin";
}

export function dashboardPathForRole(role: ProfileRole): string {
	return role === "admin" ? "/dashboard/admin" : "/dashboard/couple";
}
