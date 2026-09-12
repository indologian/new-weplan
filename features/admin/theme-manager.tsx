import {
	createAdminTheme,
	disableAdminTheme,
	updateAdminTheme,
} from "../../actions/admin/themes";

export function AdminThemeManager({
	themes,
	tiers,
}: {
	themes: Record<string, unknown>[];
	tiers: Record<string, unknown>[];
}) {
	return (
		<div className="space-y-6">
			<form
				action={async (form) => {
					"use server";
					await createAdminTheme({
						name: form.get("name"),
						slug: form.get("slug"),
						tierId: form.get("tierId"),
						description: form.get("description") || null,
						thumbnailPath: form.get("thumbnailPath"),
						previewPath: form.get("previewPath") || null,
						rendererKey: form.get("rendererKey"),
						isActive: true,
					});
				}}
				className="grid gap-3 rounded-lg border border-border p-5"
			>
				<h2 className="font-semibold">Tambah metadata tema</h2>
				<input name="name" required placeholder="Nama" />
				<input name="slug" required placeholder="slug" />
				<select name="tierId">
					{tiers.map((tier) => (
						<option key={String(tier.id)} value={String(tier.id)}>
							{String(tier.name)}
						</option>
					))}
				</select>
				<input name="description" placeholder="Deskripsi" />
				<input name="thumbnailPath" required placeholder="Thumbnail path" />
				<input name="previewPath" placeholder="Preview path" />
				<input name="rendererKey" required placeholder="Renderer key" />
				<button type="submit">Tambah tema</button>
			</form>
			{themes.map((theme) => (
				<form
					action={async (form) => {
						"use server";
						await updateAdminTheme({
							id: theme.id,
							name: form.get("name"),
							slug: form.get("slug"),
							tierId: form.get("tierId"),
							description: form.get("description") || null,
							thumbnailPath: form.get("thumbnailPath"),
							previewPath: form.get("previewPath") || null,
							rendererKey: form.get("rendererKey"),
							isActive: form.get("isActive") === "on",
						});
					}}
					className="grid gap-2 rounded-lg border border-border p-5"
					key={String(theme.id)}
				>
					<input name="name" defaultValue={String(theme.name)} required />
					<input name="slug" defaultValue={String(theme.slug)} required />
					<select name="tierId" defaultValue={String(theme.tier_id)}>
						{tiers.map((tier) => (
							<option key={String(tier.id)} value={String(tier.id)}>
								{String(tier.name)}
							</option>
						))}
					</select>
					<input
						name="description"
						defaultValue={theme.description ? String(theme.description) : ""}
					/>
					<input
						name="thumbnailPath"
						defaultValue={String(theme.thumbnail_path)}
						required
					/>
					<input
						name="previewPath"
						defaultValue={theme.preview_path ? String(theme.preview_path) : ""}
					/>
					<input
						name="rendererKey"
						defaultValue={String(theme.renderer_key)}
						required
					/>
					<label>
						<input
							type="checkbox"
							name="isActive"
							defaultChecked={Boolean(theme.is_active)}
						/>{" "}
						Active
					</label>
					<div className="flex gap-2">
						<button type="submit">Simpan</button>
						<button
							formAction={async () => {
								"use server";
								await disableAdminTheme({ id: theme.id });
							}}
							type="submit"
						>
							Disable
						</button>
					</div>
				</form>
			))}
		</div>
	);
}
