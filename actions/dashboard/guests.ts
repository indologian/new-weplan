"use server";

import { requireCoupleDashboardContext } from "../../lib/dashboard/authorization";
import {
	buildPersonalInvitationPath,
	decryptInviteeToken,
	encryptInviteeToken,
	generateInviteeToken,
	hashInviteeToken,
} from "../../lib/dashboard/invitee-token";
import {
	dashboardChildIdSchema,
	dashboardGuestNameSchema,
} from "../../validations/dashboard";
import { requireOwnedDashboardInvitation } from "./shared";

const collisionRetryLimit = 3;
const guestColumns = "id,name";

function parseGuestId(guestId: string) {
	const parsed = dashboardChildIdSchema.safeParse(guestId);
	if (!parsed.success) throw new Error("Data tamu tidak dapat diakses.");
	return parsed.data;
}

function isTokenHashCollision(
	error: { code?: string; message?: string } | null,
) {
	return (
		error?.code === "23505" &&
		(error.message ?? "").includes("guest_token_hash")
	);
}

async function requireOwnedGuest(
	supabase: Awaited<
		ReturnType<typeof requireCoupleDashboardContext>
	>["supabase"],
	invitationId: string,
	guestId: string,
) {
	const id = parseGuestId(guestId);
	const { data, error } = await supabase
		.from("invitation_guests")
		.select("id,name,guest_token_encrypted")
		.eq("id", id)
		.eq("invitation_id", invitationId)
		.maybeSingle();
	if (error || !data) throw new Error("Data tamu tidak dapat diakses.");
	return data;
}

export async function createDashboardGuest(
	invitationId: string,
	name: unknown,
) {
	const { supabase, userId } = await requireCoupleDashboardContext();
	const invitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		invitationId,
	);
	const parsedName = dashboardGuestNameSchema.safeParse(name);
	if (!parsedName.success) throw new Error("Nama tamu tidak valid.");

	for (let attempt = 0; attempt < collisionRetryLimit; attempt += 1) {
		const token = generateInviteeToken();
		const { data, error } = await supabase
			.from("invitation_guests")
			.insert({
				invitation_id: String(invitation.id),
				name: parsedName.data,
				guest_token_hash: hashInviteeToken(token),
				guest_token_encrypted: encryptInviteeToken(token),
			})
			.select(guestColumns)
			.single();
		if (!error && data) {
			return {
				guest: { id: String(data.id), name: String(data.name) },
				path: buildPersonalInvitationPath(String(invitation.slug), token),
			};
		}
		if (!isTokenHashCollision(error)) {
			throw new Error("Tamu tidak dapat ditambahkan.");
		}
	}
	throw new Error("Tautan tamu tidak dapat dibuat. Silakan coba lagi.");
}

export async function updateDashboardGuest(
	invitationId: string,
	guestId: string,
	name: unknown,
) {
	const { supabase, userId } = await requireCoupleDashboardContext();
	const invitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedGuest = await requireOwnedGuest(
		supabase,
		String(invitation.id),
		guestId,
	);
	const parsedName = dashboardGuestNameSchema.safeParse(name);
	if (!parsedName.success) throw new Error("Nama tamu tidak valid.");
	const { data, error } = await supabase
		.from("invitation_guests")
		.update({ name: parsedName.data })
		.eq("id", ownedGuest.id)
		.eq("invitation_id", invitation.id)
		.select(guestColumns)
		.single();
	if (error || !data) throw new Error("Tamu tidak dapat diperbarui.");
	return { id: String(data.id), name: String(data.name) };
}

export async function deleteDashboardGuest(
	invitationId: string,
	guestId: string,
) {
	const { supabase, userId } = await requireCoupleDashboardContext();
	const invitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedGuest = await requireOwnedGuest(
		supabase,
		String(invitation.id),
		guestId,
	);
	const { data, error } = await supabase
		.from("invitation_guests")
		.delete()
		.eq("id", ownedGuest.id)
		.eq("invitation_id", invitation.id)
		.select("id")
		.maybeSingle();
	if (error || !data) throw new Error("Tamu tidak dapat dihapus.");
}

export async function copyDashboardGuestLink(
	invitationId: string,
	guestId: string,
) {
	const { supabase, userId } = await requireCoupleDashboardContext();
	const invitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		invitationId,
	);
	const guest = await requireOwnedGuest(
		supabase,
		String(invitation.id),
		guestId,
	);
	const token = decryptInviteeToken(String(guest.guest_token_encrypted));
	return buildPersonalInvitationPath(String(invitation.slug), token);
}

export async function regenerateDashboardGuestLink(
	invitationId: string,
	guestId: string,
) {
	const { supabase, userId } = await requireCoupleDashboardContext();
	const invitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		invitationId,
	);
	const guest = await requireOwnedGuest(
		supabase,
		String(invitation.id),
		guestId,
	);

	for (let attempt = 0; attempt < collisionRetryLimit; attempt += 1) {
		const token = generateInviteeToken();
		const tokenMaterial = {
			guest_token_hash: hashInviteeToken(token),
			guest_token_encrypted: encryptInviteeToken(token),
		};
		const { data, error } = await supabase
			.from("invitation_guests")
			.update(tokenMaterial)
			.eq("id", guest.id)
			.eq("invitation_id", invitation.id)
			.select("id")
			.maybeSingle();
		if (!error && data) {
			return buildPersonalInvitationPath(String(invitation.slug), token);
		}
		if (!isTokenHashCollision(error)) {
			throw new Error("Tautan tamu tidak dapat diperbarui.");
		}
	}
	throw new Error("Tautan tamu tidak dapat dibuat. Silakan coba lagi.");
}
