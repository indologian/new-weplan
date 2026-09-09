"use server";

import { requireAuthenticatedMutation } from "@/lib/auth/authorization";
import {
	type Step1IdentityInput,
	step1IdentitySchema,
} from "@/validations/invitation";

export async function createPersistentDraft(
	themeSlug: string,
	input: Step1IdentityInput,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const parsed = step1IdentitySchema.safeParse(input);

	if (!parsed.success) {
		throw new Error("Data identitas tidak valid.");
	}

	const { data: theme, error: themeError } = await supabase
		.from("themes")
		.select("id")
		.eq("slug", themeSlug)
		.eq("is_active", true)
		.single();

	if (themeError || !theme) {
		throw new Error("Tema tidak ditemukan atau tidak aktif.");
	}

	const invitationData = {
		groom_name: parsed.data.groom_name,
		groom_father_name: parsed.data.groom_father_name,
		groom_mother_name: parsed.data.groom_mother_name,
		bride_name: parsed.data.bride_name,
		bride_father_name: parsed.data.bride_father_name,
		bride_mother_name: parsed.data.bride_mother_name,
		opening_greeting: parsed.data.opening_greeting,
		prayer_text: parsed.data.prayer_text,
	};

	const { data: existingDraft, error: existingDraftError } = await supabase
		.from("invitations")
		.select("id")
		.eq("slug", parsed.data.slug)
		.eq("couple_id", userId)
		.eq("theme_id", theme.id)
		.eq("status", "draft")
		.maybeSingle();

	if (existingDraftError) {
		throw new Error("Gagal memeriksa draf undangan.");
	}

	if (existingDraft) {
		const { error: updateError } = await supabase
			.from("invitations")
			.update(invitationData)
			.eq("id", existingDraft.id)
			.eq("couple_id", userId)
			.eq("status", "draft");

		if (updateError) {
			throw new Error("Gagal memperbarui draf undangan.");
		}

		return { invitationId: existingDraft.id };
	}

	const { data: invitation, error: insertError } = await supabase
		.from("invitations")
		.insert({
			couple_id: userId,
			theme_id: theme.id,
			slug: parsed.data.slug,
			...invitationData,
			status: "draft",
		})
		.select("id")
		.single();

	if (insertError) {
		throw new Error("Slug tersebut sudah digunakan atau draf gagal dibuat.");
	}

	return { invitationId: invitation.id };
}
