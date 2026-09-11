import "server-only";

import { getThemeRenderer } from "../../themes/registry";
import { invitationSlugSchema } from "../../validations/invitation";
import { hashInviteeToken } from "../dashboard/invitee-token";
import { signValidatedPublicInvitationAssets } from "../storage/public-invitation-assets";
import { createAdminClient } from "../supabase/admin";
import {
	mapPublicInvitationViewModel,
	mapPublicInvitee,
} from "./public-view-model";

const publicTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const invitationColumns =
	"id,couple_id,slug,status,expires_at,groom_name,groom_father_name,groom_mother_name,groom_photo_path,bride_name,bride_father_name,bride_mother_name,bride_photo_path,cover_photo_path,music_path,opening_greeting,prayer_text,rsvp_enabled,wishes_enabled,themes!inner(renderer_key)";

function relation(value: unknown): Record<string, unknown> | null {
	const item = Array.isArray(value) ? value[0] : value;
	return item && typeof item === "object"
		? (item as Record<string, unknown>)
		: null;
}

function nullableString(value: unknown) {
	return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown) {
	if (value === null || value === undefined) return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function validLifecycle(row: Record<string, unknown>, now: Date) {
	if (row.status !== "active" || typeof row.expires_at !== "string")
		return false;
	const expiry = new Date(row.expires_at).getTime();
	return Number.isFinite(expiry) && expiry > now.getTime();
}

export async function getPublicInvitation(
	slugInput: unknown,
	tokenInput: unknown,
	options: { now?: Date; createClient?: typeof createAdminClient } = {},
) {
	const slug = invitationSlugSchema.safeParse(slugInput);
	if (
		!slug.success ||
		typeof tokenInput !== "string" ||
		!publicTokenPattern.test(tokenInput)
	) {
		return null;
	}
	const tokenHash = hashInviteeToken(tokenInput);
	return loadPublicInvitationByHash(
		slug.data,
		tokenHash,
		options.now ?? new Date(),
		options.createClient ?? createAdminClient,
	);
}

async function loadPublicInvitationByHash(
	slug: string,
	tokenHash: string,
	now: Date,
	createClient: typeof createAdminClient,
) {
	const supabase = createClient();
	const { data: guest, error: guestError } = await supabase
		.from("invitation_guests")
		.select("invitation_id,name")
		.eq("guest_token_hash", tokenHash)
		.maybeSingle();
	if (guestError || !guest) return null;

	const { data: row, error: invitationError } = await supabase
		.from("invitations")
		.select(invitationColumns)
		.eq("id", guest.invitation_id)
		.maybeSingle();
	if (
		invitationError ||
		!row ||
		row.slug !== slug ||
		!validLifecycle(row, now)
	) {
		return null;
	}
	const theme = relation(row.themes);
	const rendererKey = nullableString(theme?.renderer_key);
	if (!rendererKey || !getThemeRenderer(rendererKey)) return null;

	const invitationId = String(row.id);
	const [
		eventsResult,
		storiesResult,
		galleryResult,
		giftsResult,
		wishesResult,
	] = await Promise.all([
		supabase
			.from("wedding_events")
			.select(
				"id,name,event_date,start_time,end_time,until_finished,address,latitude,longitude,is_main_event,sort_order",
			)
			.eq("invitation_id", invitationId)
			.order("sort_order", { ascending: true })
			.range(0, 9999),
		supabase
			.from("stories")
			.select("id,title,story_date,description,image_path,sort_order")
			.eq("invitation_id", invitationId)
			.order("sort_order", { ascending: true })
			.range(0, 9999),
		supabase
			.from("gallery_items")
			.select("id,type,image_path,youtube_video_id,sort_order")
			.eq("invitation_id", invitationId)
			.order("sort_order", { ascending: true })
			.range(0, 9999),
		supabase
			.from("gift_accounts")
			.select("id,bank_name,account_number,account_holder,sort_order")
			.eq("invitation_id", invitationId)
			.order("sort_order", { ascending: true })
			.range(0, 9999),
		supabase
			.from("wishes")
			.select("message,created_at,invitation_guests!inner(name)")
			.eq("invitation_id", invitationId)
			.order("created_at", { ascending: false })
			.range(0, 9999),
	]);
	if (
		eventsResult.error ||
		storiesResult.error ||
		galleryResult.error ||
		giftsResult.error ||
		wishesResult.error
	)
		return null;

	const invitation = {
		id: invitationId,
		slug: String(row.slug),
		groomName: nullableString(row.groom_name),
		groomFatherName: nullableString(row.groom_father_name),
		groomMotherName: nullableString(row.groom_mother_name),
		groomPhotoPath: nullableString(row.groom_photo_path),
		brideName: nullableString(row.bride_name),
		brideFatherName: nullableString(row.bride_father_name),
		brideMotherName: nullableString(row.bride_mother_name),
		bridePhotoPath: nullableString(row.bride_photo_path),
		coverPhotoPath: nullableString(row.cover_photo_path),
		musicPath: nullableString(row.music_path),
		openingGreeting: nullableString(row.opening_greeting),
		prayerText: nullableString(row.prayer_text),
		rsvpEnabled: row.rsvp_enabled === true,
		wishesEnabled: row.wishes_enabled === true,
	};
	const stories = (storiesResult.data ?? []).map((item) => ({
		id: String(item.id),
		title: String(item.title),
		storyDate: nullableString(item.story_date),
		description: String(item.description),
		imagePath: nullableString(item.image_path),
	}));
	const gallery = (galleryResult.data ?? []).map((item) => ({
		id: String(item.id),
		type: item.type === "image" ? ("image" as const) : ("youtube" as const),
		imagePath: nullableString(item.image_path),
		youtubeVideoId: nullableString(item.youtube_video_id),
	}));
	let signedUrls: Record<string, string>;
	try {
		signedUrls = await signValidatedPublicInvitationAssets({
			supabase,
			ownerId: String(row.couple_id),
			invitation,
			stories,
			gallery,
		});
	} catch {
		return null;
	}

	const viewModel = mapPublicInvitationViewModel(
		{
			ownerId: String(row.couple_id),
			rendererKey,
			invitation,
			events: (eventsResult.data ?? []).map((event) => ({
				id: String(event.id),
				name: String(event.name),
				eventDate: String(event.event_date),
				startTime: String(event.start_time),
				endTime: nullableString(event.end_time),
				untilFinished: event.until_finished === true,
				address: String(event.address),
				latitude: numberOrNull(event.latitude),
				longitude: numberOrNull(event.longitude),
				isMainEvent: event.is_main_event === true,
			})),
			stories,
			gallery,
			gifts: (giftsResult.data ?? []).map((gift) => ({
				id: String(gift.id),
				bankName: String(gift.bank_name),
				accountNumber: String(gift.account_number),
				accountHolder: String(gift.account_holder),
			})),
			signedUrls,
		},
		(wishesResult.data ?? []).map((wish) => ({
			name: String(relation(wish.invitation_guests)?.name ?? "Tamu"),
			message: String(wish.message),
			createdAt: String(wish.created_at),
		})),
	);
	return {
		rendererKey,
		invitation: viewModel,
		invitee: mapPublicInvitee(String(guest.name)),
	};
}
