import type { ReactNode } from "react";
import { requireAdminProfile } from "@/lib/auth/authorization";
import { AdminNavigation } from "../../../features/admin/admin-navigation";

export default async function AdminDashboardLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	await requireAdminProfile();
	return (
		<>
			<AdminNavigation />
			{children}
		</>
	);
}
