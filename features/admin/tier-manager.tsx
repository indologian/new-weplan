import { updateAdminTier } from "../../actions/admin/tiers";

export function AdminTierManager({
	tiers,
}: {
	tiers: Record<string, unknown>[];
}) {
	return (
		<div className="space-y-4">
			{tiers.map((tier) => (
				<form
					action={async (form) => {
						"use server";
						await updateAdminTier({
							id: tier.id,
							price: form.get("price"),
							activeMonths: Number(form.get("activeMonths")),
							maxGalleryImages: Number(form.get("maxGalleryImages")),
							maxYoutubeVideos: Number(form.get("maxYoutubeVideos")),
							isActive: form.get("isActive") === "on",
						});
					}}
					className="grid gap-2 rounded-lg border border-border p-5"
					key={String(tier.id)}
				>
					<h2 className="font-semibold">
						{String(tier.name)} ({String(tier.code)})
					</h2>
					<label>
						Harga
						<input
							name="price"
							defaultValue={String(tier.price)}
							inputMode="numeric"
							required
						/>
					</label>
					<label>
						Bulan aktif
						<input
							name="activeMonths"
							type="number"
							min="1"
							defaultValue={String(tier.active_months)}
							required
						/>
					</label>
					<label>
						Maksimum gambar
						<input
							name="maxGalleryImages"
							type="number"
							min="0"
							defaultValue={String(tier.max_gallery_images)}
							required
						/>
					</label>
					<label>
						Maksimum YouTube
						<input
							name="maxYoutubeVideos"
							type="number"
							min="0"
							defaultValue={String(tier.max_youtube_videos)}
							required
						/>
					</label>
					<label>
						<input
							name="isActive"
							type="checkbox"
							defaultChecked={Boolean(tier.is_active)}
						/>{" "}
						Active
					</label>
					<button type="submit">Simpan tier</button>
				</form>
			))}
		</div>
	);
}
