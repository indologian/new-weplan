import type { ReactNode } from "react";
import { requireAuthenticatedProfile } from "@/lib/auth/authorization";

export default async function DashboardLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	await requireAuthenticatedProfile();

	return <>{children}</>;
}
