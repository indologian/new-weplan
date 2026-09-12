"use server";
import { adminPaginationSchema } from "../../validations/admin";
import { requireAdminContext } from "./context";

export async function getAdminActiveInvitations(input: unknown = {}) {
	const { supabase } = await requireAdminContext();
	const parsed = adminPaginationSchema.safeParse(input);
	if (!parsed.success) throw new Error("Halaman undangan tidak valid.");
	const from = (parsed.data.page - 1) * parsed.data.pageSize;
	const { data, error, count } = await supabase
		.from("invitations")
		.select(
			"id,slug,status,paid_at,expires_at,couple_id,theme_id,profiles(full_name),themes(name)",
			{ count: "exact" },
		)
		.eq("status", "active")
		.order("expires_at", { ascending: true })
		.order("id", { ascending: true })
		.range(from, from + parsed.data.pageSize - 1);
	if (error) throw new Error("Undangan aktif tidak dapat dimuat.");
	return { rows: data ?? [], count: count ?? 0, ...parsed.data };
}
