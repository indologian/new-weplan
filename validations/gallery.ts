import { z } from "zod";

export const galleryInvitationIdSchema = z.string().uuid();
export const galleryItemIdSchema = z.string().uuid();

export const galleryMediaTypeSchema = z.enum(["image", "youtube"]);

export const reorderGallerySchema = z
	.array(galleryItemIdSchema)
	.superRefine((ids, context) => {
		if (new Set(ids).size !== ids.length) {
			context.addIssue({ code: "custom", message: "ID galeri duplikat." });
		}
	});

export type GalleryMediaType = z.infer<typeof galleryMediaTypeSchema>;

export type GalleryItem = {
	id: string;
	type: GalleryMediaType;
	imagePath: string | null;
	youtubeVideoId: string | null;
	sortOrder: number;
};
