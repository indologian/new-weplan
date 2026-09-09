import { redirect } from "next/navigation";
import { dashboardPathForRole } from "@/lib/auth/access";
import { requireAuthenticatedProfile } from "@/lib/auth/authorization";

export default async function DashboardPage() {
	const profile = await requireAuthenticatedProfile();
	redirect(dashboardPathForRole(profile.role));
}
