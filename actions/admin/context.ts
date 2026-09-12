import "server-only";
import { requireAdminProfile } from "../../lib/auth/authorization";
import { createClient } from "../../lib/supabase/server";

export async function requireAdminContext() {
	const profile = await requireAdminProfile();
	const supabase = await createClient();
	return { profile, supabase };
}
