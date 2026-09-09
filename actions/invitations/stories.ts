"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { getStoryImagePath } from "../../lib/storage/story-image";
import {
	reorderStoriesSchema,
	type Story,
	type StoryContentInput,
	storyContentInputSchema,
	storyIdSchema,
	storyInvitationIdSchema,
} from "../../validations/story";

type AuthenticatedSupabase = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

const storyColumns = "id,title,story_date,description,image_path,sort_order";

async function requireOwnedInvitation(
	supabase: AuthenticatedSupabase,
	userId: string,
	invitationId: string,
) {
	const parsed = storyInvitationIdSchema.safeParse(invitationId);
	if (!parsed.success) throw new Error("Undangan tidak valid.");
	const { data, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsed.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");
	return parsed.data;
}

async function requireStoryInInvitation(
	supabase: AuthenticatedSupabase,
	invitationId: string,
	storyId: string,
) {
	const parsed = storyIdSchema.safeParse(storyId);
	if (!parsed.success) throw new Error("Cerita tidak valid.");
	const { data, error } = await supabase
		.from("stories")
		.select("id,image_path")
		.eq("id", parsed.data)
		.eq("invitation_id", invitationId)
		.maybeSingle();
	if (error || !data) {
		throw new Error("Cerita tidak ditemukan pada undangan ini.");
	}
	return data;
}

function parseContent(input: StoryContentInput) {
	const parsed = storyContentInputSchema.safeParse(input);
	if (!parsed.success) throw new Error("Data cerita tidak valid.");
	return parsed.data;
}

function toPersistenceStory(story: StoryContentInput) {
	return {
		title: story.title,
		story_date: story.storyDate,
		description: story.description,
	};
}

function fromPersistenceStory(row: Record<string, unknown>): Story {
	return {
		id: String(row.id),
		title: String(row.title),
		storyDate: row.story_date === null ? null : String(row.story_date),
		description: String(row.description),
		imagePath: row.image_path === null ? null : String(row.image_path),
		sortOrder: Number(row.sort_order),
	};
}

export async function getStories(invitationId: string): Promise<Story[]> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const { data, error } = await supabase
		.from("stories")
		.select(storyColumns)
		.eq("invitation_id", ownedInvitationId)
		.order("sort_order", { ascending: true })
		.range(0, 9999);
	if (error) throw new Error("Gagal memuat cerita.");
	return (data ?? []).map((row) => fromPersistenceStory(row));
}

export async function createStory(
	invitationId: string,
	input: StoryContentInput,
): Promise<Story> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const story = parseContent(input);
	const { data: lastStory, error: orderError } = await supabase
		.from("stories")
		.select("sort_order")
		.eq("invitation_id", ownedInvitationId)
		.order("sort_order", { ascending: false })
		.limit(1)
		.maybeSingle();
	if (orderError) throw new Error("Gagal menentukan urutan cerita.");

	const { data, error } = await supabase
		.from("stories")
		.insert({
			invitation_id: ownedInvitationId,
			...toPersistenceStory(story),
			image_path: null,
			sort_order: lastStory ? Number(lastStory.sort_order) + 1 : 0,
		})
		.select(storyColumns)
		.single();
	if (error || !data) throw new Error("Gagal membuat cerita.");
	return fromPersistenceStory(data);
}

export async function updateStory(
	invitationId: string,
	storyId: string,
	input: StoryContentInput,
): Promise<Story> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedStory = await requireStoryInInvitation(
		supabase,
		ownedInvitationId,
		storyId,
	);
	const story = parseContent(input);
	const { data, error } = await supabase
		.from("stories")
		.update(toPersistenceStory(story))
		.eq("id", ownedStory.id)
		.eq("invitation_id", ownedInvitationId)
		.select(storyColumns)
		.single();
	if (error || !data) throw new Error("Gagal memperbarui cerita.");
	return fromPersistenceStory(data);
}

export async function deleteStory(invitationId: string, storyId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedStory = await requireStoryInInvitation(
		supabase,
		ownedInvitationId,
		storyId,
	);

	if (ownedStory.image_path !== null) {
		const path = getStoryImagePath(userId, ownedInvitationId, ownedStory.id);
		const { error: storageError } = await supabase.storage
			.from("invitation-assets")
			.remove([path]);
		if (storageError) throw new Error("Gagal menghapus gambar cerita.");
	}

	const { error } = await supabase
		.from("stories")
		.delete()
		.eq("id", ownedStory.id)
		.eq("invitation_id", ownedInvitationId)
		.select("id")
		.maybeSingle();
	if (error) throw new Error("Gagal menghapus cerita.");
}

export async function reorderStories(invitationId: string, storyIds: string[]) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const parsedIds = reorderStoriesSchema.safeParse(storyIds);
	if (!parsedIds.success) throw new Error("Urutan cerita tidak valid.");

	const { data: existingStories, error: lookupError } = await supabase
		.from("stories")
		.select("id")
		.eq("invitation_id", ownedInvitationId)
		.order("id", { ascending: true })
		.range(0, 9999);
	if (lookupError) throw new Error("Gagal memeriksa cerita.");

	const existingIds = new Set((existingStories ?? []).map(({ id }) => id));
	if (
		existingIds.size !== parsedIds.data.length ||
		parsedIds.data.some((storyId) => !existingIds.has(storyId))
	) {
		throw new Error(
			"Daftar cerita sudah berubah. Muat ulang sebelum mengurutkan kembali.",
		);
	}

	for (const [sortOrder, storyId] of parsedIds.data.entries()) {
		const { error } = await supabase
			.from("stories")
			.update({ sort_order: sortOrder })
			.eq("id", storyId)
			.eq("invitation_id", ownedInvitationId)
			.select("id")
			.maybeSingle();
		if (error) throw new Error("Gagal menyimpan urutan cerita.");
	}
}
