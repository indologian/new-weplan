import "server-only";

import type { WishRequest } from "../../validations/invitee-interactions";
import { authorizeInviteeToken } from "./authorization";
import { InviteeInteractionError } from "./errors";

type AuthorizationOptions = Parameters<typeof authorizeInviteeToken>[1];
type Relation = { name?: unknown } | Array<{ name?: unknown }> | null;

function guestName(relation: Relation) {
	const guest = Array.isArray(relation) ? relation[0] : relation;
	return typeof guest?.name === "string" ? guest.name : "Tamu";
}

async function requireWishesContext(
	token: unknown,
	options?: AuthorizationOptions,
) {
	const context = await authorizeInviteeToken(token, options);
	if (!context?.wishesEnabled) throw new InviteeInteractionError("not_found");
	return context;
}

export async function getInviteeWishes(
	token: unknown,
	options?: AuthorizationOptions,
) {
	const context = await requireWishesContext(token, options);
	const { data, error } = await context.supabase
		.from("wishes")
		.select("id,guest_id,message,created_at,invitation_guests!inner(name)")
		.eq("invitation_id", context.invitationId)
		.order("created_at", { ascending: false })
		.order("id", { ascending: true })
		.range(0, 9999);
	if (error) throw new InviteeInteractionError("server_error");
	return {
		wishes: (data ?? []).map((wish) => ({
			name: guestName(wish.invitation_guests as Relation),
			message: String(wish.message),
			createdAt: String(wish.created_at),
			isMine: String(wish.guest_id) === context.guestId,
		})),
	};
}

export async function putInviteeWish(
	token: unknown,
	input: WishRequest,
	options?: AuthorizationOptions,
) {
	const context = await requireWishesContext(token, options);
	const { data, error } = await context.supabase
		.from("wishes")
		.upsert(
			{
				invitation_id: context.invitationId,
				guest_id: context.guestId,
				message: input.message,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "guest_id" },
		)
		.select("guest_id,message,created_at")
		.maybeSingle();
	if (error || !data) throw new InviteeInteractionError("server_error");
	return {
		name: context.guestName,
		message: String(data.message),
		createdAt: String(data.created_at),
		isMine: true,
	};
}
