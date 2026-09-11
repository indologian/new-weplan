import "server-only";

import {
	mapInvitationViewModel,
	type ReviewViewModelInput,
} from "../../features/invitation-builder/review/map-invitation-view-model";
import type { InvitationViewModel, InviteeViewModel } from "../../types/theme";

export type PublicWishInput = {
	name: string;
	message: string;
	createdAt: string;
};

export function mapPublicInvitationViewModel(
	input: ReviewViewModelInput,
	wishes: PublicWishInput[],
): InvitationViewModel {
	const mapped = mapInvitationViewModel(input);
	return {
		...mapped,
		id: `invitation-${mapped.slug}`,
		events: mapped.events.map((event, index) => {
			const source = input.events[index];
			const validCoordinates =
				source?.latitude !== null &&
				source?.longitude !== null &&
				source.latitude >= -90 &&
				source.latitude <= 90 &&
				source.longitude >= -180 &&
				source.longitude <= 180;
			return {
				...event,
				id: `event-${index}`,
				mapsUrl: validCoordinates ? event.mapsUrl : undefined,
			};
		}),
		story: mapped.story.map((story, index) => ({
			...story,
			id: `story-${index}`,
		})),
		gallery: mapped.gallery.map((item, index) => ({
			...item,
			id: `gallery-${index}`,
		})),
		gifts: mapped.gifts.map((gift, index) => ({
			...gift,
			id: `gift-${index}`,
		})),
		wishes: wishes.map((wish, index) => ({
			id: `wish-${index}`,
			name: wish.name,
			message: wish.message,
			createdAt: wish.createdAt,
		})),
	};
}

export function mapPublicInvitee(name: string): InviteeViewModel {
	return { id: "invitee", name, status: "pending" };
}
