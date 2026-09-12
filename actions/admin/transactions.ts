"use server";
import { adminPaginationSchema } from "../../validations/admin";
import { requireAdminContext } from "./context";

export async function getAdminTransactions(input: unknown = {}) {
	const { supabase } = await requireAdminContext();
	const parsed = adminPaginationSchema.safeParse(input);
	if (!parsed.success) throw new Error("Halaman transaksi tidak valid.");
	const from = (parsed.data.page - 1) * parsed.data.pageSize;
	const { data, error, count } = await supabase
		.from("transactions")
		.select(
			"id,midtrans_order_id,invitation_id,couple_id,theme_name_snapshot,tier_code_snapshot,tier_name_snapshot,price_snapshot,active_months_snapshot,status,payment_type,paid_at,created_at,profiles(full_name),invitations(slug)",
			{ count: "exact" },
		)
		.order("created_at", { ascending: false })
		.order("id", { ascending: false })
		.range(from, from + parsed.data.pageSize - 1);
	if (error) throw new Error("Transaksi tidak dapat dimuat.");
	return { rows: data ?? [], count: count ?? 0, ...parsed.data };
}
