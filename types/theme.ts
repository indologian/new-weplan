export interface EventModel {
	id: string;
	isMainEvent: boolean;
	title: string;
	date: string;
	time: string;
	locationName: string;
	locationAddress: string;
	mapsUrl?: string;
}

export interface StoryModel {
	id: string;
	date: string | null;
	title: string;
	description: string;
	imageUrl?: string;
}

export interface ImageModel {
	id: string;
	type: "image";
	url: string;
	alt: string;
}

export interface YouTubeModel {
	id: string;
	type: "youtube";
	videoId: string;
}

export interface GiftAccountModel {
	id: string;
	provider: string;
	accountNumber: string;
	accountName: string;
}

export interface WishModel {
	id: string;
	name: string;
	message: string;
	createdAt: string;
}

export interface InvitationViewModel {
	id: string;
	slug: string;
	theme: {
		rendererKey: string;
	};
	coverPhotoUrl?: string;
	musicUrl?: string;
	rsvpEnabled: boolean;
	wishesEnabled: boolean;
	greeting: string;
	weddingDate: string; // ISO date string for countdown
	groom: {
		name: string;
		nickname: string;
		parents: string;
		photoUrl?: string;
		instagram?: string;
	};
	bride: {
		name: string;
		nickname: string;
		parents: string;
		photoUrl?: string;
		instagram?: string;
	};
	prayer: string;
	events: EventModel[];
	story: StoryModel[];
	gallery: Array<ImageModel | YouTubeModel>;
	gifts: GiftAccountModel[];
	wishes: WishModel[];
	footerGreeting: string;
}

export interface InviteeViewModel {
	id: string;
	name: string;
	status: "pending" | "attending" | "declined";
}
