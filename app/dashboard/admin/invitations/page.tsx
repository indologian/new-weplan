import { getAdminActiveInvitations } from "../../../../actions/admin/invitations";
import { AdminActiveInvitationList } from "../../../../features/admin/active-invitation-list";

export default async function AdminInvitationsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const result = await getAdminActiveInvitations({
		page: typeof params.page === "string" ? params.page : 1,
		pageSize: typeof params.pageSize === "string" ? params.pageSize : 20,
	});
	return (
		<main className="mx-auto max-w-6xl px-6 py-10">
			<h1 className="mb-6 text-3xl font-bold">Active Invitations</h1>
			<AdminActiveInvitationList result={result as never} />
		</main>
	);
}
