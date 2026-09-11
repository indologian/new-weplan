import type { getCoupleDashboard } from "../../../actions/dashboard/dashboard";
import { GiftsForm } from "../../invitation-builder/components/gifts-form";
import { DashboardNavigation } from "./dashboard-navigation";
import { GuestsSection } from "./guests-section";
import { InvitationsSection } from "./invitations-section";
import { OverviewSection } from "./overview-section";
import { RsvpSection } from "./rsvp-section";
import { SettingsSection } from "./settings-section";
import { WishesSection } from "./wishes-section";

type DashboardData = Awaited<ReturnType<typeof getCoupleDashboard>>;

export function CoupleDashboard({ dashboard }: { dashboard: DashboardData }) {
	const selectedId = dashboard.selectedInvitation?.id ?? null;
	return (
		<div className="space-y-12">
			<DashboardNavigation active="overview" />
			<OverviewSection
				totalInvitations={dashboard.invitations.length}
				statusCounts={dashboard.statusCounts}
				rsvp={dashboard.overviewRsvpSummary}
				wishes={dashboard.overviewWishesCount}
			/>
			<InvitationsSection
				invitations={dashboard.invitations}
				selectedId={selectedId}
			/>
			{selectedId ? (
				<>
					<GuestsSection invitationId={selectedId} guests={dashboard.guests} />
					<RsvpSection summary={dashboard.rsvpSummary} rows={dashboard.rsvps} />
					<WishesSection invitationId={selectedId} wishes={dashboard.wishes} />
					<section id="gifts" aria-labelledby="gifts-dashboard-title">
						<h2 id="gifts-dashboard-title" className="mb-4 font-serif text-2xl">
							Hadiah
						</h2>
						<GiftsForm invitationId={selectedId} />
					</section>
					<SettingsSection
						invitationId={selectedId}
						fullName={dashboard.profile.fullName}
					/>
				</>
			) : (
				<p className="rounded-lg border border-border p-5 text-muted-foreground">
					Buat atau pilih undangan untuk mengelola tamu, RSVP, ucapan, hadiah,
					dan pengaturan.
				</p>
			)}
		</div>
	);
}
