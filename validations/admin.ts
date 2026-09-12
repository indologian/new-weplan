import { z } from "zod";
import { invitationSlugSchema } from "./invitation";

export const adminPaginationSchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		pageSize: z.coerce.number().int().min(1).max(50).default(20),
	})
	.strict();

const optionalText = z.string().trim().max(500).nullable();
export const adminThemeSchema = z
	.object({
		name: z.string().trim().min(1).max(100),
		slug: invitationSlugSchema,
		tierId: z.string().uuid(),
		description: optionalText,
		thumbnailPath: z.string().trim().min(1).max(500),
		previewPath: optionalText,
		rendererKey: z.string().trim().min(1).max(100),
		isActive: z.boolean(),
	})
	.strict();

export const adminThemeUpdateSchema = adminThemeSchema
	.extend({ id: z.string().uuid() })
	.strict();
export const adminThemeIdSchema = z.object({ id: z.string().uuid() }).strict();

export const adminTierUpdateSchema = z
	.object({
		id: z.string().uuid(),
		price: z
			.string()
			.regex(/^\d+$/)
			.transform((value) => BigInt(value)),
		activeMonths: z.number().int().positive(),
		maxGalleryImages: z.number().int().nonnegative(),
		maxYoutubeVideos: z.number().int().nonnegative(),
		isActive: z.boolean(),
	})
	.strict();

export const adminHomepageToggleSchema = z
	.object({
		sectionId: z.string().uuid(),
		isVisible: z.boolean(),
	})
	.strict();
