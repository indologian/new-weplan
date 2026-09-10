import { getGalleryImagePath } from "../../../lib/storage/gallery-image";
import {
	getCanonicalMusicExtension,
	getInvitationMusicPath,
} from "../../../lib/storage/invitation-music";
import { getInvitationPhotoDestination } from "../../../lib/storage/invitation-photo";
import { getStoryImagePath } from "../../../lib/storage/story-image";
import type { InvitationViewModel } from "../../../types/theme";

export type PersistedReviewInvitation = {
	id: string;
	slug: string;
	groomName: string | null;
	groomFatherName: string | null;
	groomMotherName: string | null;
	groomPhotoPath: string | null;
	brideName: string | null;
	brideFatherName: string | null;
	brideMotherName: string | null;
	bridePhotoPath: string | null;
	coverPhotoPath: string | null;
	musicPath: string | null;
	openingGreeting: string | null;
	prayerText: string | null;
	rsvpEnabled: boolean;
	wishesEnabled: boolean;
};

export type PersistedReviewEvent = {
	id: string;
	name: string;
	eventDate: string;
	startTime: string;
	endTime: string | null;
	untilFinished: boolean;
	address: string;
	latitude: number | null;
	longitude: number | null;
	isMainEvent: boolean;
};

export type PersistedReviewStory = {
	id: string;
	title: string;
	storyDate: string | null;
	description: string;
	imagePath: string | null;
};

export type PersistedReviewGalleryItem = {
	id: string;
	type: "image" | "youtube";
	imagePath: string | null;
	youtubeVideoId: string | null;
};

export type PersistedReviewGift = {
	id: string;
	bankName: string;
	accountNumber: string;
	accountHolder: string;
};

export type ReviewViewModelInput = {
	ownerId: string;
	rendererKey: string;
	invitation: PersistedReviewInvitation;
	events: PersistedReviewEvent[];
	stories: PersistedReviewStory[];
	gallery: PersistedReviewGalleryItem[];
	gifts: PersistedReviewGift[];
	signedUrls: Record<string, string>;
};

function parents(...names: Array<string | null>) {
	return names.filter((name): name is string => Boolean(name)).join(" & ");
}

function eventDateTime(event: PersistedReviewEvent) {
	return `${event.eventDate}T${event.startTime}`;
}

export function mapInvitationViewModel({
	ownerId,
	rendererKey,
	invitation,
	events,
	stories,
	gallery,
	gifts,
	signedUrls,
}: ReviewViewModelInput): InvitationViewModel {
	const signed = (path: string) => signedUrls[path];
	const coverPath = getInvitationPhotoDestination(
		ownerId,
		invitation.id,
		"cover",
	).path;
	const groomPath = getInvitationPhotoDestination(
		ownerId,
		invitation.id,
		"groom",
	).path;
	const bridePath = getInvitationPhotoDestination(
		ownerId,
		invitation.id,
		"bride",
	).path;
	const mainEvent = events.find((event) => event.isMainEvent);
	const musicExtension = invitation.musicPath
		? getCanonicalMusicExtension(invitation.musicPath, ownerId, invitation.id)
		: null;
	const musicPath = musicExtension
		? getInvitationMusicPath(ownerId, invitation.id, musicExtension)
		: null;

	return {
		id: invitation.id,
		slug: invitation.slug,
		theme: { rendererKey },
		coverPhotoUrl: signed(coverPath),
		musicUrl: musicPath ? signed(musicPath) : undefined,
		rsvpEnabled: invitation.rsvpEnabled,
		wishesEnabled: invitation.wishesEnabled,
		greeting: invitation.openingGreeting ?? "",
		weddingDate: mainEvent ? eventDateTime(mainEvent) : "",
		groom: {
			name: invitation.groomName ?? "",
			nickname: invitation.groomName ?? "",
			parents: parents(invitation.groomFatherName, invitation.groomMotherName),
			photoUrl: signed(groomPath),
		},
		bride: {
			name: invitation.brideName ?? "",
			nickname: invitation.brideName ?? "",
			parents: parents(invitation.brideFatherName, invitation.brideMotherName),
			photoUrl: signed(bridePath),
		},
		prayer: invitation.prayerText ?? "",
		events: events.map((event) => ({
			id: event.id,
			isMainEvent: event.isMainEvent,
			title: event.name,
			date: eventDateTime(event),
			time: event.untilFinished
				? `${event.startTime} - selesai`
				: [event.startTime, event.endTime].filter(Boolean).join(" - "),
			locationName: event.name,
			locationAddress: event.address,
			mapsUrl:
				event.latitude === null || event.longitude === null
					? undefined
					: `https://www.google.com/maps?q=${event.latitude},${event.longitude}`,
		})),
		story: stories.map((story) => {
			const path = getStoryImagePath(ownerId, invitation.id, story.id);
			return {
				id: story.id,
				date: story.storyDate,
				title: story.title,
				description: story.description,
				imageUrl: signed(path),
			};
		}),
		gallery: gallery.reduce<InvitationViewModel["gallery"]>((items, item) => {
			if (item.type === "youtube" && item.youtubeVideoId) {
				items.push({
					id: item.id,
					type: "youtube",
					videoId: item.youtubeVideoId,
				});
				return items;
			}
			const path = getGalleryImagePath(ownerId, invitation.id, item.id);
			const url = signed(path);
			if (url) {
				items.push({
					id: item.id,
					type: "image",
					url,
					alt: "Wedding gallery",
				});
			}
			return items;
		}, []),
		gifts: gifts.map((gift) => ({
			id: gift.id,
			provider: gift.bankName,
			accountNumber: gift.accountNumber,
			accountName: gift.accountHolder,
		})),
		wishes: [],
		footerGreeting: "Terima kasih atas doa dan restunya.",
	};
}
