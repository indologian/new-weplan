"use server";
import { revalidatePath } from "next/cache";
import { getThemeRenderer } from "../../themes/registry";
import {
	adminThemeIdSchema,
	adminThemeSchema,
	adminThemeUpdateSchema,
} from "../../validations/admin";
import { requireAdminContext } from "./context";

const fields =
	"id,tier_id,name,slug,description,thumbnail_path,preview_path,renderer_key,is_active,created_at,updated_at";

function themePayload(value: typeof adminThemeSchema._output) {
	return {
		tier_id: value.tierId,
		name: value.name,
		slug: value.slug,
		description: value.description,
		thumbnail_path: value.thumbnailPath,
		preview_path: value.previewPath,
		renderer_key: value.rendererKey,
		is_active: value.isActive,
	};
}

async function requireTier(
	supabase: Awaited<ReturnType<typeof requireAdminContext>>["supabase"],
	tierId: string,
) {
	const { data, error } = await supabase
		.from("tiers")
		.select("id")
		.eq("id", tierId)
		.maybeSingle();
	if (error || !data) throw new Error("Tier tidak valid.");
}

export async function getAdminThemes() {
	const { supabase } = await requireAdminContext();
	const { data, error } = await supabase
		.from("themes")
		.select(fields)
		.order("name")
		.range(0, 99);
	if (error) throw new Error("Tema tidak dapat dimuat.");
	return data ?? [];
}

export async function createAdminTheme(input: unknown) {
	const { supabase } = await requireAdminContext();
	const parsed = adminThemeSchema.safeParse(input);
	if (!parsed.success) throw new Error("Data tema tidak valid.");
	if (!getThemeRenderer(parsed.data.rendererKey))
		throw new Error("Renderer tema tidak dikenal.");
	await requireTier(supabase, parsed.data.tierId);
	const { data, error } = await supabase
		.from("themes")
		.insert(themePayload(parsed.data))
		.select(fields)
		.single();
	if (error?.code === "23505")
		throw new Error("Slug atau renderer tema sudah digunakan.");
	if (error || !data) throw new Error("Tema tidak dapat dibuat.");
	revalidatePath("/dashboard/admin/themes");
	return data;
}

export async function updateAdminTheme(input: unknown) {
	const { supabase } = await requireAdminContext();
	const parsed = adminThemeUpdateSchema.safeParse(input);
	if (!parsed.success) throw new Error("Data tema tidak valid.");
	if (!getThemeRenderer(parsed.data.rendererKey))
		throw new Error("Renderer tema tidak dikenal.");
	await requireTier(supabase, parsed.data.tierId);
	const { data, error } = await supabase
		.from("themes")
		.update(themePayload(parsed.data))
		.eq("id", parsed.data.id)
		.select(fields)
		.maybeSingle();
	if (error?.code === "23505")
		throw new Error("Slug atau renderer tema sudah digunakan.");
	if (error || !data) throw new Error("Tema tidak dapat diperbarui.");
	revalidatePath("/dashboard/admin/themes");
	return data;
}

export async function disableAdminTheme(input: unknown) {
	const { supabase } = await requireAdminContext();
	const parsed = adminThemeIdSchema.safeParse(input);
	if (!parsed.success) throw new Error("Tema tidak valid.");
	const { data, error } = await supabase
		.from("themes")
		.update({ is_active: false })
		.eq("id", parsed.data.id)
		.select("id,is_active")
		.maybeSingle();
	if (error || !data) throw new Error("Tema tidak dapat dinonaktifkan.");
	revalidatePath("/dashboard/admin/themes");
	return data;
}
