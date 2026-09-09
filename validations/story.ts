import { z } from "zod";

export const storyIdSchema = z.string().uuid("Story ID tidak valid.");
export const storyInvitationIdSchema = z
	.string()
	.uuid("Invitation ID tidak valid.");

export const storyContentInputSchema = z.object({
	title: z.string().trim().min(1, "Judul cerita wajib diisi."),
	storyDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal cerita tidak valid.")
		.nullable(),
	description: z.string().trim().min(1, "Deskripsi cerita wajib diisi."),
	sortOrder: z.number().int().nonnegative(),
});

export const storySchema = storyContentInputSchema.extend({
	id: storyIdSchema,
	imagePath: z.string().nullable(),
});

export const reorderStoriesSchema = z
	.array(storyIdSchema)
	.superRefine((storyIds, context) => {
		if (new Set(storyIds).size !== storyIds.length) {
			context.addIssue({
				code: "custom",
				message: "Urutan cerita mengandung ID duplikat.",
			});
		}
	});

export type StoryContentInput = z.infer<typeof storyContentInputSchema>;
export type Story = z.infer<typeof storySchema>;
