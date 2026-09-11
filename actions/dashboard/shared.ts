import "server-only";

import type { requireCoupleDashboardContext } from "../../lib/dashboard/authorization";
import { dashboardInvitationIdSchema } from "../../validations/dashboard";

export type DashboardSupabase = Awaited<
	ReturnType<typeof requireCoupleDashboardContext>
>["supabase"];

export async function requireOwnedDashboardInvitation(
	supabase: DashboardSupabase,
	userId: string,
	invitationId: string,
) {
	const parsed = dashboardInvitationIdSchema.safeParse(invitationId);
	if (!parsed.success) throw new Error("Undangan tidak dapat diakses.");
	const { data, error } = await supabase
		.from("invitations")
		.select("id,slug,status,rsvp_enabled,wishes_enabled,created_at")
		.eq("id", parsed.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Undangan tidak dapat diakses.");
	return data;
}
