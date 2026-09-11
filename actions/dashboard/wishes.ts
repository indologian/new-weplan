"use server";

import { requireCoupleDashboardContext } from "../../lib/dashboard/authorization";
import { dashboardChildIdSchema } from "../../validations/dashboard";
import { requireOwnedDashboardInvitation } from "./shared";

export async function deleteDashboardWish(
	invitationId: string,
	wishId: string,
) {
	const { supabase, userId } = await requireCoupleDashboardContext();
	const invitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		invitationId,
	);
	const parsedWishId = dashboardChildIdSchema.safeParse(wishId);
	if (!parsedWishId.success) throw new Error("Ucapan tidak dapat diakses.");
	const { data: wish, error: lookupError } = await supabase
		.from("wishes")
		.select("id")
		.eq("id", parsedWishId.data)
		.eq("invitation_id", invitation.id)
		.maybeSingle();
	if (lookupError || !wish) throw new Error("Ucapan tidak dapat diakses.");
	const { data, error } = await supabase
		.from("wishes")
		.delete()
		.eq("id", wish.id)
		.eq("invitation_id", invitation.id)
		.select("id")
		.maybeSingle();
	if (error || !data) throw new Error("Ucapan tidak dapat dihapus.");
}
