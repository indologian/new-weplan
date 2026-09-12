import { getAdminTransactions } from "../../../../actions/admin/transactions";
import { AdminTransactionList } from "../../../../features/admin/transaction-list";

export default async function AdminTransactionsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const result = await getAdminTransactions({
		page: typeof params.page === "string" ? params.page : 1,
		pageSize: typeof params.pageSize === "string" ? params.pageSize : 20,
	});
	return (
		<main className="mx-auto max-w-6xl px-6 py-10">
			<h1 className="mb-6 text-3xl font-bold">Transactions</h1>
			<AdminTransactionList result={result as never} />
		</main>
	);
}
