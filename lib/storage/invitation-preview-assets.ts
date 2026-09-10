import { getGalleryImagePath } from "./gallery-image";
import {
	getCanonicalMusicExtension,
	getInvitationMusicPath,
} from "./invitation-music";
import { getInvitationPhotoDestination } from "./invitation-photo";
import { getStoryImagePath } from "./story-image";

type PreviewInvitationAssets = {
	id: string;
	coverPhotoPath: string | null;
	groomPhotoPath: string | null;
	bridePhotoPath: string | null;
	musicPath: string | null;
};

type PreviewStoryAsset = { id: string; imagePath: string | null };
type PreviewGalleryAsset = {
	id: string;
	type: "image" | "youtube";
	imagePath: string | null;
};

export const previewAssetTtlSeconds = 60 * 60;

export function collectCanonicalPreviewPaths(
	coupleId: string,
	invitation: PreviewInvitationAssets,
	stories: PreviewStoryAsset[],
	gallery: PreviewGalleryAsset[],
) {
	const paths: string[] = [];
	const photos = [
		["cover", invitation.coverPhotoPath],
		["groom", invitation.groomPhotoPath],
		["bride", invitation.bridePhotoPath],
	] as const;
	for (const [type, persistedPath] of photos) {
		const { path } = getInvitationPhotoDestination(
			coupleId,
			invitation.id,
			type,
		);
		if (persistedPath === path) paths.push(path);
	}

	for (const story of stories) {
		const path = getStoryImagePath(coupleId, invitation.id, story.id);
		if (story.imagePath === path) paths.push(path);
	}
	for (const item of gallery) {
		if (item.type !== "image") continue;
		const path = getGalleryImagePath(coupleId, invitation.id, item.id);
		if (item.imagePath === path) paths.push(path);
	}

	if (invitation.musicPath) {
		const extension = getCanonicalMusicExtension(
			invitation.musicPath,
			coupleId,
			invitation.id,
		);
		if (extension) {
			paths.push(getInvitationMusicPath(coupleId, invitation.id, extension));
		}
	}

	return [...new Set(paths)];
}
