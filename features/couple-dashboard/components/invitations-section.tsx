import Link from "next/link";
import type { DashboardInvitation } from "../../../actions/dashboard/dashboard";
import { getBuilderEditHref } from "../../invitation-builder/review/navigation";

const statusLabels: Record<DashboardInvitation["status"], string> = {
	draft: "Draft",
	payment_pending: "Menunggu pembayaran",
	active: "Aktif",
	expired: "Kedaluwarsa",
};

export function InvitationsSection({
	invitations,
	selectedId,
}: {
	invitations: DashboardInvitation[];
	selectedId: string | null;
}) {
	return (
		<section id="invitations" aria-labelledby="invitations-title">
			<h2 id="invitations-title" className="font-serif text-2xl">
				Undangan
			</h2>
			{invitations.length === 0 ? (
				<p className="mt-3 text-muted-foreground">Belum ada undangan.</p>
			) : (
				<ul className="mt-4 grid gap-4 lg:grid-cols-2">
					{invitations.map((invitation) => (
						<li
							key={invitation.id}
							className="rounded-lg border border-border bg-card p-5"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="font-semibold">/{invitation.slug}</h3>
									<p className="text-sm text-muted-foreground">
										{statusLabels[invitation.status]}
									</p>
								</div>
								{selectedId === invitation.id && (
									<span className="text-xs text-primary">Dipilih</span>
								)}
							</div>
							<div className="mt-4 flex flex-wrap gap-3 text-sm">
								<Link href={`/dashboard/couple?invitationId=${invitation.id}`}>
									Kelola
								</Link>
								<Link
									href={getBuilderEditHref(invitation.themeSlug, invitation.id)}
								>
									Edit
								</Link>
								<Link href={`/create/review/${invitation.id}/preview`}>
									Preview privat
								</Link>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
