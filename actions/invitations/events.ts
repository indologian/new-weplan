"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	type EventInput,
	eventIdSchema,
	eventInputSchema,
	invitationIdSchema,
	normalizeEventInput,
	reorderEventsSchema,
} from "../../validations/event";

type AuthenticatedSupabase = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

export type WeddingEvent = EventInput & { id: string };

const eventColumns =
	"id,name,event_date,start_time,end_time,until_finished,address,latitude,longitude,is_main_event,sort_order";

async function requireOwnedInvitation(
	supabase: AuthenticatedSupabase,
	userId: string,
	invitationId: string,
) {
	const parsedInvitationId = invitationIdSchema.safeParse(invitationId);
	if (!parsedInvitationId.success) {
		throw new Error("Undangan tidak valid.");
	}

	const { data, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsedInvitationId.data)
		.eq("couple_id", userId)
		.maybeSingle();

	if (error || !data) {
		throw new Error("Tidak memiliki akses ke undangan ini.");
	}

	return parsedInvitationId.data;
}

async function requireEventInInvitation(
	supabase: AuthenticatedSupabase,
	invitationId: string,
	eventId: string,
) {
	const parsedEventId = eventIdSchema.safeParse(eventId);
	if (!parsedEventId.success) {
		throw new Error("Event tidak valid.");
	}

	const { data, error } = await supabase
		.from("wedding_events")
		.select("id")
		.eq("id", parsedEventId.data)
		.eq("invitation_id", invitationId)
		.maybeSingle();

	if (error || !data) {
		throw new Error("Event tidak ditemukan pada undangan ini.");
	}

	return parsedEventId.data;
}

function parseEventInput(input: EventInput) {
	const parsed = eventInputSchema.safeParse(input);
	if (!parsed.success) {
		throw new Error("Data event tidak valid.");
	}
	return normalizeEventInput(parsed.data);
}

function toPersistenceEvent(event: EventInput) {
	return {
		name: event.name,
		event_date: event.eventDate,
		start_time: event.startTime,
		end_time: event.untilFinished ? null : event.endTime,
		until_finished: event.untilFinished,
		address: event.address,
		latitude: event.latitude,
		longitude: event.longitude,
		is_main_event: event.isMainEvent,
	};
}

function fromPersistenceEvent(row: Record<string, unknown>): WeddingEvent {
	return {
		id: String(row.id),
		name: String(row.name),
		eventDate: String(row.event_date),
		startTime: String(row.start_time),
		endTime: row.end_time === null ? null : String(row.end_time),
		untilFinished: Boolean(row.until_finished),
		address: String(row.address),
		latitude: row.latitude === null ? null : Number(row.latitude),
		longitude: row.longitude === null ? null : Number(row.longitude),
		isMainEvent: Boolean(row.is_main_event),
		sortOrder: Number(row.sort_order),
	};
}

async function unsetMainEvent(
	supabase: AuthenticatedSupabase,
	invitationId: string,
) {
	const { error } = await supabase
		.from("wedding_events")
		.update({ is_main_event: false })
		.eq("invitation_id", invitationId)
		.eq("is_main_event", true)
		.select("id")
		.maybeSingle();

	if (error) {
		throw new Error("Gagal memperbarui event utama.");
	}
}

export async function getWeddingEvents(
	invitationId: string,
): Promise<WeddingEvent[]> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const { data, error } = await supabase
		.from("wedding_events")
		.select(eventColumns)
		.eq("invitation_id", ownedInvitationId)
		.order("sort_order", { ascending: true })
		.range(0, 9999);

	if (error) {
		throw new Error("Gagal memuat event.");
	}
	return (data ?? []).map((row) => fromPersistenceEvent(row));
}

export async function createWeddingEvent(
	invitationId: string,
	input: EventInput,
): Promise<WeddingEvent> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const event = parseEventInput(input);

	const { data: lastEvent, error: orderError } = await supabase
		.from("wedding_events")
		.select("sort_order")
		.eq("invitation_id", ownedInvitationId)
		.order("sort_order", { ascending: false })
		.limit(1)
		.maybeSingle();
	if (orderError) {
		throw new Error("Gagal menentukan urutan event.");
	}

	if (event.isMainEvent) {
		await unsetMainEvent(supabase, ownedInvitationId);
	}

	const { data, error } = await supabase
		.from("wedding_events")
		.insert({
			invitation_id: ownedInvitationId,
			...toPersistenceEvent(event),
			sort_order: lastEvent ? Number(lastEvent.sort_order) + 1 : 0,
		})
		.select(eventColumns)
		.single();

	if (error || !data) {
		throw new Error("Gagal membuat event.");
	}
	return fromPersistenceEvent(data);
}

export async function updateWeddingEvent(
	invitationId: string,
	eventId: string,
	input: EventInput,
): Promise<WeddingEvent> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedEventId = await requireEventInInvitation(
		supabase,
		ownedInvitationId,
		eventId,
	);
	const event = parseEventInput(input);

	if (event.isMainEvent) {
		await unsetMainEvent(supabase, ownedInvitationId);
	}

	const { data, error } = await supabase
		.from("wedding_events")
		.update(toPersistenceEvent(event))
		.eq("id", ownedEventId)
		.eq("invitation_id", ownedInvitationId)
		.select(eventColumns)
		.single();

	if (error || !data) {
		throw new Error("Gagal memperbarui event.");
	}
	return fromPersistenceEvent(data);
}

export async function deleteWeddingEvent(
	invitationId: string,
	eventId: string,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedEventId = await requireEventInInvitation(
		supabase,
		ownedInvitationId,
		eventId,
	);
	const { error } = await supabase
		.from("wedding_events")
		.delete()
		.eq("id", ownedEventId)
		.eq("invitation_id", ownedInvitationId)
		.select("id")
		.maybeSingle();

	if (error) {
		throw new Error("Gagal menghapus event.");
	}
}

export async function reorderWeddingEvents(
	invitationId: string,
	eventIds: string[],
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const parsedIds = reorderEventsSchema.safeParse(eventIds);
	if (!parsedIds.success) {
		throw new Error("Urutan event tidak valid.");
	}

	const { data: existingEvents, error: lookupError } = await supabase
		.from("wedding_events")
		.select("id")
		.eq("invitation_id", ownedInvitationId)
		.order("id", { ascending: true })
		.range(0, 9999);
	if (lookupError) {
		throw new Error("Gagal memeriksa event.");
	}

	const existingIds = new Set((existingEvents ?? []).map(({ id }) => id));
	if (
		existingIds.size !== parsedIds.data.length ||
		parsedIds.data.some((eventId) => !existingIds.has(eventId))
	) {
		throw new Error("Urutan hanya boleh memuat event dari undangan ini.");
	}

	for (const [sortOrder, eventId] of parsedIds.data.entries()) {
		const { error } = await supabase
			.from("wedding_events")
			.update({ sort_order: sortOrder })
			.eq("id", eventId)
			.eq("invitation_id", ownedInvitationId)
			.select("id")
			.maybeSingle();
		if (error) {
			throw new Error("Gagal menyimpan urutan event.");
		}
	}
}

export async function setMainWeddingEvent(
	invitationId: string,
	eventId: string,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedEventId = await requireEventInInvitation(
		supabase,
		ownedInvitationId,
		eventId,
	);

	await unsetMainEvent(supabase, ownedInvitationId);
	const { error } = await supabase
		.from("wedding_events")
		.update({ is_main_event: true })
		.eq("id", ownedEventId)
		.eq("invitation_id", ownedInvitationId)
		.select("id")
		.maybeSingle();

	if (error) {
		throw new Error("Gagal menetapkan event utama.");
	}
}
