import { toggleAdminHomepageSection } from "../../actions/admin/homepage";

export function AdminHomepageVisibility({
	sections,
}: {
	sections: Record<string, unknown>[];
}) {
	return (
		<ul className="space-y-3">
			{sections.map((section) => (
				<li
					className="flex items-center justify-between rounded-lg border border-border p-4"
					key={String(section.id)}
				>
					<div>
						<p className="font-medium">{String(section.section_name)}</p>
						<p className="text-sm text-muted-foreground">
							{String(section.section_key)} · urutan{" "}
							{String(section.sort_order)}
						</p>
					</div>
					<form
						action={async () => {
							"use server";
							await toggleAdminHomepageSection({
								sectionId: section.id,
								isVisible: !section.is_visible,
							});
						}}
					>
						<button type="submit">
							{section.is_visible ? "Sembunyikan" : "Tampilkan"}
						</button>
					</form>
				</li>
			))}
		</ul>
	);
}
