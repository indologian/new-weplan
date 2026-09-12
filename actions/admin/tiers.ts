"use server";
import { revalidatePath } from "next/cache";
import { adminTierUpdateSchema } from "../../validations/admin";
import { requireAdminContext } from "./context";

const fields =
	"id,code,name,price,active_months,max_gallery_images,max_youtube_videos,is_active";

export async function getAdminTiers() {
	const { supabase } = await requireAdminContext();
	const { data, error } = await supabase
		.from("tiers")
		.select(fields)
		.order("code")
		.range(0, 2);
	if (error) throw new Error("Tier tidak dapat dimuat.");
	return data ?? [];
}

export async function updateAdminTier(input: unknown) {
	const { supabase } = await requireAdminContext();
	const parsed = adminTierUpdateSchema.safeParse(input);
	if (!parsed.success) throw new Error("Konfigurasi tier tidak valid.");
	const { data, error } = await supabase
		.from("tiers")
		.update({
			price: parsed.data.price.toString(),
			active_months: parsed.data.activeMonths,
			max_gallery_images: parsed.data.maxGalleryImages,
			max_youtube_videos: parsed.data.maxYoutubeVideos,
			is_active: parsed.data.isActive,
		})
		.eq("id", parsed.data.id)
		.select(fields)
		.maybeSingle();
	if (error || !data) throw new Error("Tier tidak dapat diperbarui.");
	revalidatePath("/dashboard/admin/tiers");
	return data;
}
