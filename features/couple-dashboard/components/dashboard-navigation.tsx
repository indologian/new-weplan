import type { DashboardSection } from "../../../validations/dashboard";

const sections: Array<{ id: DashboardSection; label: string }> = [
	{ id: "overview", label: "Overview" },
	{ id: "invitations", label: "Undangan" },
	{ id: "guests", label: "Tamu" },
	{ id: "rsvp", label: "RSVP" },
	{ id: "wishes", label: "Ucapan" },
	{ id: "gifts", label: "Hadiah" },
	{ id: "settings", label: "Pengaturan" },
];

export function DashboardNavigation({ active }: { active: DashboardSection }) {
	return (
		<nav aria-label="Bagian dashboard" className="flex flex-wrap gap-2">
			{sections.map((section) => (
				<a
					key={section.id}
					href={`#${section.id}`}
					aria-current={active === section.id ? "page" : undefined}
					className="rounded-full border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
				>
					{section.label}
				</a>
			))}
		</nav>
	);
}
