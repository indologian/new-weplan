import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
	authorizeCanonicalAssetPath,
	createAuthorizedSignedReadUrls,
} from "./authorized-assets";
import {
	collectCanonicalPreviewPaths,
	previewAssetTtlSeconds,
} from "./invitation-preview-assets";

type PublicAssetInvitation = {
	id: string;
	coverPhotoPath: string | null;
	groomPhotoPath: string | null;
	bridePhotoPath: string | null;
	musicPath: string | null;
};
type PublicAssetStory = { id: string; imagePath: string | null };
type PublicAssetGallery = {
	id: string;
	type: "image" | "youtube";
	imagePath: string | null;
};

export async function signValidatedPublicInvitationAssets(input: {
	supabase: SupabaseClient;
	ownerId: string;
	invitation: PublicAssetInvitation;
	stories: PublicAssetStory[];
	gallery: PublicAssetGallery[];
}) {
	const paths = collectCanonicalPreviewPaths(
		input.ownerId,
		input.invitation,
		input.stories,
		input.gallery,
	);
	const persistedPaths = [
		input.invitation.coverPhotoPath,
		input.invitation.groomPhotoPath,
		input.invitation.bridePhotoPath,
		input.invitation.musicPath,
		...input.stories.map(({ imagePath }) => imagePath),
		...input.gallery
			.filter(({ type }) => type === "image")
			.map(({ imagePath }) => imagePath),
	].filter((path): path is string => Boolean(path));
	if (persistedPaths.some((path) => !paths.includes(path))) {
		throw new Error("Undangan tidak tersedia.");
	}
	const context = {
		supabase: input.supabase,
		userId: input.ownerId,
		invitationId: input.invitation.id,
	};
	return createAuthorizedSignedReadUrls(
		context,
		paths.map((path) => authorizeCanonicalAssetPath(context, path)),
		previewAssetTtlSeconds,
	);
}
