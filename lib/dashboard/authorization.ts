import "server-only";

import { requireCoupleProfile } from "../auth/authorization";
import { createClient } from "../supabase/server";

export async function requireCoupleDashboardContext() {
	const profile = await requireCoupleProfile();
	const supabase = await createClient();
	return { profile, supabase, userId: profile.id };
}
