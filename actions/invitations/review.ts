"use server";

import { mapInvitationViewModel } from "../../features/invitation-builder/review/map-invitation-view-model";
import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	authorizeCanonicalAssetPath,
	createAuthorizedSignedReadUrls,
	requireOwnedInvitationAssetContext,
} from "../../lib/storage/authorized-assets";
import {
	collectCanonicalPreviewPaths,
	previewAssetTtlSeconds,
} from "../../lib/storage/invitation-preview-assets";
import { musicInvitationIdSchema } from "../../validations/music";

type SupabaseClient = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

const invitationColumns =
	"id,slug,groom_name,groom_father_name,groom_mother_name,groom_photo_path,bride_name,bride_father_name,bride_mother_name,bride_photo_path,cover_photo_path,music_path,opening_greeting,prayer_text,rsvp_enabled,wishes_enabled,themes!inner(name,slug,renderer_key,tiers!inner(code,name,price,active_months))";

async function requireOwnedReviewInvitation(
	supabase: SupabaseClient,
	userId: string,
	invitationId: string,
) {
	const parsedId = musicInvitationIdSchema.safeParse(invitationId);
	if (!parsedId.success) throw new Error("Undangan tidak valid.");
	const { data, error } = await supabase
		.from("invitations")
		.select(invitationColumns)
		.eq("id", parsedId.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");
	return data as Record<string, unknown>;
}

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
	return value === null || value === undefined ? null : Number(value);
}

async function loadChildren(supabase: SupabaseClient, invitationId: string) {
	const [events, stories, gallery, gifts] = await Promise.all([
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
	]);
	if (events.error || stories.error || gallery.error || gifts.error) {
		throw new Error("Gagal memuat isi undangan.");
	}
	return {
		events: events.data ?? [],
		stories: stories.data ?? [],
		gallery: gallery.data ?? [],
		gifts: gifts.data ?? [],
	};
}

export async function getOwnedInvitationReview(invitationId: string) {
	const context = await requireOwnedInvitationAssetContext(invitationId);
	const { supabase, userId } = context;
	const row = await requireOwnedReviewInvitation(
		supabase,
		userId,
		context.invitationId,
	);
	const theme = relation(row.themes);
	const tier = relation(theme?.tiers);
	if (!theme || !tier)
		throw new Error("Konfigurasi tema tidak dapat diselesaikan.");
	const id = String(row.id);
	const children = await loadChildren(supabase, id);
	const invitation = {
		id,
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
	const stories = children.stories.map((item) => ({
		id: String(item.id),
		title: String(item.title),
		storyDate: nullableString(item.story_date),
		description: String(item.description),
		imagePath: nullableString(item.image_path),
	}));
	const gallery = children.gallery.map((item) => ({
		id: String(item.id),
		type: item.type === "image" ? ("image" as const) : ("youtube" as const),
		imagePath: nullableString(item.image_path),
		youtubeVideoId: nullableString(item.youtube_video_id),
	}));
	const paths = collectCanonicalPreviewPaths(
		userId,
		invitation,
		stories,
		gallery,
	);
	const signedUrls = await createAuthorizedSignedReadUrls(
		context,
		paths.map((path) => authorizeCanonicalAssetPath(context, path)),
		previewAssetTtlSeconds,
	);

	const viewModel = mapInvitationViewModel({
		ownerId: userId,
		rendererKey: String(theme.renderer_key),
		invitation,
		events: children.events.map((event) => ({
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
		gifts: children.gifts.map((gift) => ({
			id: String(gift.id),
			bankName: String(gift.bank_name),
			accountNumber: String(gift.account_number),
			accountHolder: String(gift.account_holder),
		})),
		signedUrls,
	});

	return {
		invitationId: id,
		themeSlug: String(theme.slug),
		rendererKey: String(theme.renderer_key),
		commercial: {
			themeName: String(theme.name),
			tierCode: String(tier.code),
			tierName: String(tier.name),
			price: String(tier.price),
			activeMonths: Number(tier.active_months),
		},
		viewModel,
	};
}

export async function getOwnedBuilderResume(invitationId: string) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const row = await requireOwnedReviewInvitation(
		supabase,
		userId,
		invitationId,
	);
	const theme = relation(row.themes);
	if (!theme) throw new Error("Konfigurasi tema tidak dapat diselesaikan.");
	return {
		invitationId: String(row.id),
		themeSlug: String(theme.slug),
		identity: {
			slug: String(row.slug),
			groom_name: nullableString(row.groom_name) ?? "",
			groom_father_name: nullableString(row.groom_father_name) ?? "",
			groom_mother_name: nullableString(row.groom_mother_name) ?? "",
			bride_name: nullableString(row.bride_name) ?? "",
			bride_father_name: nullableString(row.bride_father_name) ?? "",
			bride_mother_name: nullableString(row.bride_mother_name) ?? "",
			opening_greeting: nullableString(row.opening_greeting) ?? "",
			prayer_text: nullableString(row.prayer_text) ?? "",
		},
	};
}
