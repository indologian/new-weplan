"use server";
import { requireAdminContext } from "./context";

export async function getAdminOverview() {
	const { supabase } = await requireAdminContext();
	const { data, error } = await supabase.rpc("get_admin_overview_metrics");
	const row = data?.[0];
	if (error || !row) throw new Error("Ringkasan admin tidak dapat dimuat.");
	return {
		totalPaidRevenue: String(row.total_paid_revenue),
		paidTransactionCount: Number(row.paid_transaction_count),
		pendingTransactionCount: Number(row.pending_transaction_count),
		terminalTransactionCount: Number(row.terminal_transaction_count),
		activeInvitationCount: Number(row.active_invitation_count),
	};
}
