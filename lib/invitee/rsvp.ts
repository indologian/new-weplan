import "server-only";

import type { RsvpRequest } from "../../validations/invitee-interactions";
import {
	authorizeInviteeToken,
	type InviteeAuthorizationContext,
} from "./authorization";
import { InviteeInteractionError } from "./errors";

type AuthorizationOptions = Parameters<typeof authorizeInviteeToken>[1];

async function requireRsvpContext(
	token: unknown,
	options?: AuthorizationOptions,
) {
	const context = await authorizeInviteeToken(token, options);
	if (!context?.rsvpEnabled) throw new InviteeInteractionError("not_found");
	return context;
}

function safeRsvp(row: Record<string, unknown> | null) {
	if (!row)
		return { attendance: null, guestCount: 0, responded: false } as const;
	return {
		attendance: row.attendance as "attending" | "not_attending",
		guestCount: Number(row.guest_count),
		responded: true,
	};
}

async function readOwnRsvp(context: InviteeAuthorizationContext) {
	const { data, error } = await context.supabase
		.from("rsvps")
		.select("attendance,guest_count")
		.eq("invitation_id", context.invitationId)
		.eq("guest_id", context.guestId)
		.maybeSingle();
	if (error) throw new InviteeInteractionError("server_error");
	return safeRsvp(data);
}

export async function getInviteeRsvp(
	token: unknown,
	options?: AuthorizationOptions,
) {
	return readOwnRsvp(await requireRsvpContext(token, options));
}

export async function putInviteeRsvp(
	token: unknown,
	input: RsvpRequest,
	options?: AuthorizationOptions,
) {
	const context = await requireRsvpContext(token, options);
	const { error } = await context.supabase
		.from("rsvps")
		.upsert(
			{
				invitation_id: context.invitationId,
				guest_id: context.guestId,
				attendance: input.attendance,
				guest_count: input.guestCount,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "guest_id" },
		)
		.select("guest_id")
		.maybeSingle();
	if (error) throw new InviteeInteractionError("server_error");
	return readOwnRsvp(context);
}
