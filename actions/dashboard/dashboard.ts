"use server";

import { requireCoupleDashboardContext } from "../../lib/dashboard/authorization";
import { requireOwnedDashboardInvitation } from "./shared";

export type DashboardInvitation = {
	id: string;
	slug: string;
	themeSlug: string;
	status: "draft" | "payment_pending" | "active" | "expired";
	createdAt: string;
};

export type RsvpSummary = {
	totalGuests: number;
	responded: number;
	attending: number;
	notAttending: number;
	notResponded: number;
	totalAttendingGuestCount: number;
};

export type DashboardGuest = { id: string; name: string };
export type DashboardRsvp = {
	id: string;
	guestId: string;
	guestName: string;
	attendance: "attending" | "not_attending";
	guestCount: number;
};
export type DashboardWish = {
	id: string;
	guestId: string;
	guestName: string;
	message: string;
	createdAt: string;
};

const emptyRsvpSummary: RsvpSummary = {
	totalGuests: 0,
	responded: 0,
	attending: 0,
	notAttending: 0,
	notResponded: 0,
	totalAttendingGuestCount: 0,
};

function summarizeRsvp(guestCount: number, rows: DashboardRsvp[]): RsvpSummary {
	const attendingRows = rows.filter(
		({ attendance }) => attendance === "attending",
	);
	const responded = rows.length;
	return {
		totalGuests: guestCount,
		responded,
		attending: attendingRows.length,
		notAttending: rows.filter(
			({ attendance }) => attendance === "not_attending",
		).length,
		notResponded: guestCount - responded,
		totalAttendingGuestCount: attendingRows.reduce(
			(total, row) => total + row.guestCount,
			0,
		),
	};
}

async function loadInteractionRows(
	supabase: Awaited<
		ReturnType<typeof requireCoupleDashboardContext>
	>["supabase"],
	invitationId: string,
) {
	const [guestResult, rsvpResult, wishResult] = await Promise.all([
		supabase
			.from("invitation_guests")
			.select("id,name")
			.eq("invitation_id", invitationId)
			.order("created_at", { ascending: true })
			.range(0, 9999),
		supabase
			.from("rsvps")
			.select("id,guest_id,attendance,guest_count")
			.eq("invitation_id", invitationId)
			.range(0, 9999),
		supabase
			.from("wishes")
			.select("id,guest_id,message,created_at")
			.eq("invitation_id", invitationId)
			.order("created_at", { ascending: false })
			.range(0, 9999),
	]);
	if (guestResult.error || rsvpResult.error || wishResult.error) {
		throw new Error("Data undangan tidak dapat dimuat.");
	}
	return {
		guestRows: guestResult.data ?? [],
		rsvpRows: rsvpResult.data ?? [],
		wishRows: wishResult.data ?? [],
	};
}

export async function getCoupleDashboard(selectedInvitationId?: string) {
	const { profile, supabase, userId } = await requireCoupleDashboardContext();
	const { data: invitationRows, error: invitationError } = await supabase
		.from("invitations")
		.select("id,slug,status,created_at,themes!inner(slug)")
		.eq("couple_id", userId)
		.order("created_at", { ascending: false })
		.range(0, 9999);
	if (invitationError) throw new Error("Dashboard tidak dapat dimuat.");

	const invitations = (invitationRows ?? []).map((row) => ({
		id: String(row.id),
		slug: String(row.slug),
		themeSlug: String(
			(Array.isArray(row.themes) ? row.themes[0] : row.themes)?.slug,
		),
		status: row.status as DashboardInvitation["status"],
		createdAt: String(row.created_at),
	}));
	const statusCounts = {
		draft: invitations.filter(({ status }) => status === "draft").length,
		paymentPending: invitations.filter(
			({ status }) => status === "payment_pending",
		).length,
		active: invitations.filter(({ status }) => status === "active").length,
		expired: invitations.filter(({ status }) => status === "expired").length,
	};

	const selectedId = selectedInvitationId ?? invitations[0]?.id ?? null;
	const ownedInteractionRows = await Promise.all(
		invitations.map(async ({ id }) => ({
			invitationId: id,
			...(await loadInteractionRows(supabase, id)),
		})),
	);
	const overviewGuests = ownedInteractionRows.flatMap(
		({ guestRows }) => guestRows,
	);
	const overviewRsvps = ownedInteractionRows.flatMap(({ rsvpRows }) =>
		rsvpRows.map((row) => ({
			id: String(row.id),
			guestId: String(row.guest_id),
			guestName: "Tamu",
			attendance: row.attendance as DashboardRsvp["attendance"],
			guestCount: Number(row.guest_count),
		})),
	);
	const overviewRsvpSummary = summarizeRsvp(
		overviewGuests.length,
		overviewRsvps,
	);
	const overviewWishesCount = ownedInteractionRows.reduce(
		(total, { wishRows }) => total + wishRows.length,
		0,
	);
	if (!selectedId) {
		return {
			profile,
			invitations,
			statusCounts,
			selectedInvitation: null,
			guests: [] as DashboardGuest[],
			rsvps: [] as DashboardRsvp[],
			wishes: [] as DashboardWish[],
			rsvpSummary: emptyRsvpSummary,
			overviewRsvpSummary,
			overviewWishesCount,
		};
	}

	const selectedInvitation = await requireOwnedDashboardInvitation(
		supabase,
		userId,
		selectedId,
	);
	const selectedRows = ownedInteractionRows.find(
		(row) => row.invitationId === selectedId,
	);
	if (!selectedRows) throw new Error("Undangan tidak dapat diakses.");
	const guests = selectedRows.guestRows.map((row) => ({
		id: String(row.id),
		name: String(row.name),
	}));
	const guestNames = new Map(guests.map((guest) => [guest.id, guest.name]));
	const rsvps = selectedRows.rsvpRows.map((row) => ({
		id: String(row.id),
		guestId: String(row.guest_id),
		guestName: guestNames.get(String(row.guest_id)) ?? "Tamu",
		attendance: row.attendance as DashboardRsvp["attendance"],
		guestCount: Number(row.guest_count),
	}));
	const wishes = selectedRows.wishRows.map((row) => ({
		id: String(row.id),
		guestId: String(row.guest_id),
		guestName: guestNames.get(String(row.guest_id)) ?? "Tamu",
		message: String(row.message),
		createdAt: String(row.created_at),
	}));
	const rsvpSummary = summarizeRsvp(guests.length, rsvps);

	return {
		profile,
		invitations,
		statusCounts,
		selectedInvitation: {
			id: String(selectedInvitation.id),
			slug: String(selectedInvitation.slug),
			status: selectedInvitation.status as DashboardInvitation["status"],
			rsvpEnabled: selectedInvitation.rsvp_enabled === true,
			wishesEnabled: selectedInvitation.wishes_enabled === true,
		},
		guests,
		rsvps,
		wishes,
		rsvpSummary,
		overviewRsvpSummary,
		overviewWishesCount,
	};
}
