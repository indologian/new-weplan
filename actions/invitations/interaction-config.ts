"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	type InteractionConfig,
	interactionConfigSchema,
	interactionInvitationIdSchema,
} from "../../validations/interaction-config";

type AuthenticatedSupabase = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

const interactionColumns = "rsvp_enabled,wishes_enabled";

function fromPersistenceConfig(
	row: Record<string, unknown>,
): InteractionConfig {
	return {
		rsvpEnabled: row.rsvp_enabled === true,
		wishesEnabled: row.wishes_enabled === true,
	};
}

async function requireOwnedInvitation(
	supabase: AuthenticatedSupabase,
	userId: string,
	invitationId: string,
) {
	const parsed = interactionInvitationIdSchema.safeParse(invitationId);
	if (!parsed.success) throw new Error("Undangan tidak valid.");
	const { data, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsed.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");
	return parsed.data;
}

export async function getInteractionConfig(
	invitationId: string,
): Promise<InteractionConfig> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const { data, error } = await supabase
		.from("invitations")
		.select(interactionColumns)
		.eq("id", ownedInvitationId)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Gagal memuat pengaturan interaksi.");
	return fromPersistenceConfig(data);
}

export async function updateInteractionConfig(
	invitationId: string,
	input: unknown,
): Promise<InteractionConfig> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const parsed = interactionConfigSchema.safeParse(input);
	if (!parsed.success) throw new Error("Pengaturan interaksi tidak valid.");
	const { data, error } = await supabase
		.from("invitations")
		.update({
			rsvp_enabled: parsed.data.rsvpEnabled,
			wishes_enabled: parsed.data.wishesEnabled,
		})
		.eq("id", ownedInvitationId)
		.eq("couple_id", userId)
		.select(interactionColumns)
		.single();
	if (error || !data) throw new Error("Gagal menyimpan pengaturan interaksi.");
	return fromPersistenceConfig(data);
}
