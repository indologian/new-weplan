"use server";
import { revalidatePath } from "next/cache";
import { adminHomepageToggleSchema } from "../../validations/admin";
import { requireAdminContext } from "./context";

export async function getAdminHomepageSections() {
	const { supabase } = await requireAdminContext();
	const { data, error } = await supabase
		.from("homepage_sections")
		.select("id,section_key,section_name,is_visible,sort_order")
		.order("sort_order")
		.order("section_key")
		.range(0, 99);
	if (error) throw new Error("Bagian homepage tidak dapat dimuat.");
	return data ?? [];
}

export async function toggleAdminHomepageSection(input: unknown) {
	const { supabase } = await requireAdminContext();
	const parsed = adminHomepageToggleSchema.safeParse(input);
	if (!parsed.success) throw new Error("Perubahan visibility tidak valid.");
	const { data: section, error: readError } = await supabase
		.from("homepage_sections")
		.select("id,section_key")
		.eq("id", parsed.data.sectionId)
		.maybeSingle();
	if (readError || !section || section.section_key === "navbar")
		throw new Error("Bagian homepage tidak valid.");
	const { data, error } = await supabase
		.from("homepage_sections")
		.update({ is_visible: parsed.data.isVisible })
		.eq("id", section.id)
		.select("id,section_key,is_visible")
		.maybeSingle();
	if (error || !data) throw new Error("Visibility tidak dapat diperbarui.");
	revalidatePath("/dashboard/admin/homepage");
	return data;
}
