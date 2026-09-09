import type { ReactNode } from "react";
import { requireCoupleProfile } from "@/lib/auth/authorization";

export default async function CoupleDashboardLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	await requireCoupleProfile();
	return <>{children}</>;
}
