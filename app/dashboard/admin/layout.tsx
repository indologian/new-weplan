import type { ReactNode } from "react";
import { requireAdminProfile } from "@/lib/auth/authorization";

export default async function AdminDashboardLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	await requireAdminProfile();
	return <>{children}</>;
}
