import Link from "next/link";

const links = [
	["Overview", "/dashboard/admin"],
	["Transactions", "/dashboard/admin/transactions"],
	["Invitations", "/dashboard/admin/invitations"],
	["Themes", "/dashboard/admin/themes"],
	["Tiers", "/dashboard/admin/tiers"],
	["Homepage", "/dashboard/admin/homepage"],
] as const;

export function AdminNavigation() {
	return (
		<nav
			aria-label="Admin"
			className="flex flex-wrap gap-2 border-b border-border px-6 py-4"
		>
			{links.map(([label, href]) => (
				<Link
					className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
					href={href}
					key={href}
				>
					{label}
				</Link>
			))}
		</nav>
	);
}
