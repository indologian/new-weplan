"use server";

import {
	authorizeCanonicalAssetPath,
	createAuthorizedSignedUploadUrl,
	type OwnedInvitationAssetContext,
	requireOwnedInvitationAssetContext,
} from "../../lib/storage/authorized-assets";
import { cleanupAuthorizedAssets } from "../../lib/storage/cleanup";
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

type OwnedInvitation = {
	id: string;
	musicPath: string | null;
};

async function requireOwnedInvitation(
	context: OwnedInvitationAssetContext,
): Promise<OwnedInvitation> {
	const parsedId = musicInvitationIdSchema.safeParse(context.invitationId);
	if (!parsedId.success) throw new Error("Undangan tidak valid.");

	const { data, error } = await context.supabase
		.from("invitations")
		.select("id,music_path")
		.eq("id", parsedId.data)
		.eq("couple_id", context.userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");

	return {
		id: String(data.id),
		musicPath: typeof data.music_path === "string" ? data.music_path : null,
	};
}

export async function getMusicState(invitationId: string) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const invitation = await requireOwnedInvitation(context);
	return { hasMusic: invitation.musicPath !== null };
}

export async function createMusicUploadUrl(
	invitationId: string,
	metadata: unknown,
) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const invitation = await requireOwnedInvitation(context);
	const audio = parseMusicMetadata(metadata);
	const path = authorizeCanonicalAssetPath(
		context,
		getInvitationMusicPath(context.userId, invitation.id, audio.extension),
	);
	const signedUrl = await createAuthorizedSignedUploadUrl(context, path, {
		errorMessage: "Gagal membuat upload URL audio.",
		upsert: true,
	});
	return { signedUrl };
}

export async function persistUploadedMusic(
	invitationId: string,
	metadata: unknown,
) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const { supabase, userId } = context;
	const invitation = await requireOwnedInvitation(context);
	const audio = parseMusicMetadata(metadata);
	const newPath = authorizeCanonicalAssetPath(
		context,
		getInvitationMusicPath(userId, invitation.id, audio.extension),
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
			const oldPath = authorizeCanonicalAssetPath(
				context,
				invitation.musicPath,
			);
			const cleanup = await cleanupAuthorizedAssets(storage, [oldPath]);
			if (cleanup.outcome === "partial-failure") {
				cleanupWarning =
					"Audio baru tersimpan, tetapi audio lama gagal dibersihkan.";
			}
		}
	}

	return { hasMusic: true, cleanupWarning };
}

export async function removeMusic(invitationId: string) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const { supabase, userId } = context;
	const invitation = await requireOwnedInvitation(context);
	if (!invitation.musicPath) return { hasMusic: false };

	const extension = getCanonicalMusicExtension(
		invitation.musicPath,
		userId,
		invitation.id,
	);
	if (!extension) throw new Error("Path audio tersimpan tidak valid.");

	const path = authorizeCanonicalAssetPath(context, invitation.musicPath);
	const cleanup = await cleanupAuthorizedAssets(
		supabase.storage.from(invitationAssetsBucket),
		[path],
	);
	if (cleanup.outcome === "partial-failure") {
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
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const { supabase, userId } = context;
	const invitation = await requireOwnedInvitation(context);
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
