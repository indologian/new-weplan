"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	getCanonicalMusicExtension,
	getInvitationMusicPath,
	invitationAssetsBucket,
	musicPreviewTtlSeconds,
} from "../../lib/storage/invitation-music";
import {
	musicInvitationIdSchema,
	parseMusicMetadata,
} from "../../validations/music";

type AuthenticatedSupabase = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

type OwnedInvitation = {
	id: string;
	musicPath: string | null;
};

async function requireOwnedInvitation(
	supabase: AuthenticatedSupabase,
	userId: string,
	invitationId: string,
): Promise<OwnedInvitation> {
	const parsedId = musicInvitationIdSchema.safeParse(invitationId);
	if (!parsedId.success) throw new Error("Undangan tidak valid.");

	const { data, error } = await supabase
		.from("invitations")
		.select("id,music_path")
		.eq("id", parsedId.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");

	return {
		id: String(data.id),
		musicPath: typeof data.music_path === "string" ? data.music_path : null,
	};
}

function isMissingObjectError(error: unknown) {
	if (!error || typeof error !== "object") return false;
	const candidate = error as { status?: number; statusCode?: string | number };
	return candidate.status === 404 || Number(candidate.statusCode) === 404;
}

export async function getMusicState(invitationId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const invitation = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	return { hasMusic: invitation.musicPath !== null };
}

export async function createMusicUploadUrl(
	invitationId: string,
	metadata: unknown,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const invitation = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const audio = parseMusicMetadata(metadata);
	const path = getInvitationMusicPath(userId, invitation.id, audio.extension);
	const { data, error } = await supabase.storage
		.from(invitationAssetsBucket)
		.createSignedUploadUrl(path, { upsert: true });
	if (error || !data) throw new Error("Gagal membuat upload URL audio.");
	return { signedUrl: data.signedUrl };
}

export async function persistUploadedMusic(
	invitationId: string,
	metadata: unknown,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const invitation = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const audio = parseMusicMetadata(metadata);
	const newPath = getInvitationMusicPath(
		userId,
		invitation.id,
		audio.extension,
	);
	const storage = supabase.storage.from(invitationAssetsBucket);
	const { data: object, error: objectError } = await storage.info(newPath);
	if (objectError || !object) throw new Error("Audio belum berhasil diunggah.");
	parseMusicMetadata({
		filename: `background.${audio.extension}`,
		mimeType: object.contentType,
		size: object.size,
	});

	const { data, error } = await supabase
		.from("invitations")
		.update({ music_path: newPath })
		.eq("id", invitation.id)
		.eq("couple_id", userId)
		.select("music_path")
		.maybeSingle();
	if (error || !data) throw new Error("Gagal menyimpan audio undangan.");

	let cleanupWarning: string | null = null;
	if (invitation.musicPath && invitation.musicPath !== newPath) {
		const oldExtension = getCanonicalMusicExtension(
			invitation.musicPath,
			userId,
			invitation.id,
		);
		if (oldExtension) {
			const { error: cleanupError } = await storage.remove([
				invitation.musicPath,
			]);
			if (cleanupError) {
				cleanupWarning =
					"Audio baru tersimpan, tetapi audio lama gagal dibersihkan.";
			}
		}
	}

	return { hasMusic: true, cleanupWarning };
}

export async function removeMusic(invitationId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const invitation = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	if (!invitation.musicPath) return { hasMusic: false };

	const extension = getCanonicalMusicExtension(
		invitation.musicPath,
		userId,
		invitation.id,
	);
	if (!extension) throw new Error("Path audio tersimpan tidak valid.");

	const { error: removeError } = await supabase.storage
		.from(invitationAssetsBucket)
		.remove([invitation.musicPath]);
	if (removeError && !isMissingObjectError(removeError)) {
		throw new Error("Gagal menghapus audio undangan.");
	}

	const { error } = await supabase
		.from("invitations")
		.update({ music_path: null })
		.eq("id", invitation.id)
		.eq("couple_id", userId)
		.select("music_path")
		.maybeSingle();
	if (error) throw new Error("Gagal menghapus referensi audio.");
	return { hasMusic: false };
}

export async function createMusicPreviewUrl(invitationId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const invitation = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	if (!invitation.musicPath) throw new Error("Audio belum dipilih.");
	if (
		!getCanonicalMusicExtension(invitation.musicPath, userId, invitation.id)
	) {
		throw new Error("Path audio tersimpan tidak valid.");
	}

	const { data, error } = await supabase.storage
		.from(invitationAssetsBucket)
		.createSignedUrl(invitation.musicPath, musicPreviewTtlSeconds);
	if (error || !data) throw new Error("Gagal membuat preview audio.");
	return { signedUrl: data.signedUrl, expiresIn: musicPreviewTtlSeconds };
}
