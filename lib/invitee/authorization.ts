import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { inviteeTokenSchema } from "../../validations/invitee-interactions";
import { hashInviteeToken } from "../dashboard/invitee-token";
import { createAdminClient } from "../supabase/admin";

export type InviteeAuthorizationContext = {
	supabase: SupabaseClient;
	guestId: string;
	guestName: string;
	invitationId: string;
	invitationSlug: string;
	rsvpEnabled: boolean;
	wishesEnabled: boolean;
};

export async function authorizeInviteeToken(
	tokenInput: unknown,
	options: { now?: Date; createClient?: typeof createAdminClient } = {},
): Promise<InviteeAuthorizationContext | null> {
	const token = inviteeTokenSchema.safeParse(tokenInput);
	if (!token.success) return null;

	const tokenHash = hashInviteeToken(token.data);
	const supabase = (options.createClient ?? createAdminClient)();
	const { data: guest, error: guestError } = await supabase
		.from("invitation_guests")
		.select("id,invitation_id,name")
		.eq("guest_token_hash", tokenHash)
		.maybeSingle();
	if (guestError || !guest) return null;

	const { data: invitation, error: invitationError } = await supabase
		.from("invitations")
		.select("id,slug,status,expires_at,rsvp_enabled,wishes_enabled")
		.eq("id", guest.invitation_id)
		.maybeSingle();
	if (
		invitationError ||
		!invitation ||
		invitation.status !== "active" ||
		typeof invitation.expires_at !== "string"
	) {
		return null;
	}
	const expiresAt = new Date(invitation.expires_at).getTime();
	if (
		!Number.isFinite(expiresAt) ||
		expiresAt <= (options.now ?? new Date()).getTime()
	) {
		return null;
	}

	return {
		supabase,
		guestId: String(guest.id),
		guestName: String(guest.name),
		invitationId: String(invitation.id),
		invitationSlug: String(invitation.slug),
		rsvpEnabled: invitation.rsvp_enabled === true,
		wishesEnabled: invitation.wishes_enabled === true,
	};
}
