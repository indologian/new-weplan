import { type MusicExtension, musicMimeTypes } from "../../validations/music";

export const invitationAssetsBucket = "invitation-assets";
export const musicPreviewTtlSeconds = 60 * 60;

export function getInvitationMusicPath(
	coupleId: string,
	invitationId: string,
	extension: MusicExtension,
) {
	return `${coupleId}/${invitationId}/audio/background.${extension}`;
}

export function getCanonicalMusicExtension(
	path: string,
	coupleId: string,
	invitationId: string,
): MusicExtension | null {
	for (const extension of Object.keys(musicMimeTypes) as MusicExtension[]) {
		if (path === getInvitationMusicPath(coupleId, invitationId, extension)) {
			return extension;
		}
	}
	return null;
}
