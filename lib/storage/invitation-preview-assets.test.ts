import { describe, expect, it } from "vitest";
import {
	collectCanonicalPreviewPaths,
	previewAssetTtlSeconds,
} from "./invitation-preview-assets";

describe("private preview asset collection", () => {
	const ownerId = "00000000-0000-4000-8000-000000000010";
	const invitationId = "00000000-0000-4000-8000-000000000100";

	it("collects only canonical owned paths and ignores raw foreign paths", () => {
		const paths = collectCanonicalPreviewPaths(
			ownerId,
			{
				id: invitationId,
				coverPhotoPath: `${ownerId}/${invitationId}/cover/cover.webp`,
				groomPhotoPath: "foreign/private.webp",
				bridePhotoPath: null,
				musicPath: `${ownerId}/${invitationId}/audio/background.mp3`,
			},
			[
				{
					id: "00000000-0000-4000-8000-000000000201",
					imagePath: `${ownerId}/${invitationId}/stories/00000000-0000-4000-8000-000000000201.webp`,
				},
			],
			[
				{
					id: "00000000-0000-4000-8000-000000000301",
					type: "image",
					imagePath: `${ownerId}/${invitationId}/gallery/00000000-0000-4000-8000-000000000301.webp`,
				},
				{
					id: "00000000-0000-4000-8000-000000000302",
					type: "youtube",
					imagePath: "foreign/video.webp",
				},
			],
		);

		expect(paths).toEqual([
			`${ownerId}/${invitationId}/cover/cover.webp`,
			`${ownerId}/${invitationId}/stories/00000000-0000-4000-8000-000000000201.webp`,
			`${ownerId}/${invitationId}/gallery/00000000-0000-4000-8000-000000000301.webp`,
			`${ownerId}/${invitationId}/audio/background.mp3`,
		]);
		expect(paths).not.toContain("foreign/private.webp");
		expect(previewAssetTtlSeconds).toBe(3600);
	});
});
