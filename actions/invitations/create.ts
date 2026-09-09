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

	// Cek apakah slug sudah ada
	const { data: existingSlug } = await supabase
		.from("invitations")
		.select("id, couple_id")
		.eq("slug", parsed.data.slug)
		.single();

	if (existingSlug) {
		if (existingSlug.couple_id !== userId) {
			throw new Error("Slug tersebut sudah digunakan, pilih slug lain.");
		}
		// Jika milik user sendiri, update draft yang sudah ada
		const { error: updateError } = await supabase
			.from("invitations")
			.update({
				groom_name: parsed.data.groom_name,
				groom_father_name: parsed.data.groom_father_name,
				groom_mother_name: parsed.data.groom_mother_name,
				bride_name: parsed.data.bride_name,
				bride_father_name: parsed.data.bride_father_name,
				bride_mother_name: parsed.data.bride_mother_name,
				opening_greeting: parsed.data.opening_greeting,
				prayer_text: parsed.data.prayer_text,
			})
			.eq("id", existingSlug.id);

		if (updateError) throw new Error("Gagal memperbarui draf undangan.");
		return { invitationId: existingSlug.id };
	}

	// Resolve themeSlug -> theme_id
	const { data: theme, error: themeError } = await supabase
		.from("themes")
		.select("id")
		.eq("slug", themeSlug)
		.eq("is_active", true)
		.single();

	if (themeError || !theme) {
		throw new Error("Tema tidak ditemukan atau tidak aktif.");
	}

	// Insert persistent draft
	const { data: invitation, error: insertError } = await supabase
		.from("invitations")
		.insert({
			couple_id: userId,
			theme_id: theme.id,
			slug: parsed.data.slug,
			groom_name: parsed.data.groom_name,
			groom_father_name: parsed.data.groom_father_name,
			groom_mother_name: parsed.data.groom_mother_name,
			bride_name: parsed.data.bride_name,
			bride_father_name: parsed.data.bride_father_name,
			bride_mother_name: parsed.data.bride_mother_name,
			opening_greeting: parsed.data.opening_greeting,
			prayer_text: parsed.data.prayer_text,
			status: "draft",
		})
		.select("id")
		.single();

	if (insertError) {
		throw new Error("Gagal membuat draf undangan.");
	}

	return { invitationId: invitation.id };
}
