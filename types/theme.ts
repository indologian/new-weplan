export interface EventModel {
	id: string
	title: string
	date: string
	time: string
	locationName: string
	locationAddress: string
	mapsUrl?: string
}

export interface StoryModel {
	id: string
	date: string
	title: string
	description: string
}

export interface ImageModel {
	id: string
	url: string
	alt: string
}

export interface GiftAccountModel {
	id: string
	provider: string
	accountNumber: string
	accountName: string
}

export interface WishModel {
	id: string
	name: string
	message: string
	createdAt: string
}

export interface InvitationViewModel {
	id: string
	slug: string
	theme: {
		rendererKey: string
	}
	greeting: string
	weddingDate: string // ISO date string for countdown
	groom: {
		name: string
		nickname: string
		parents: string
		instagram?: string
	}
	bride: {
		name: string
		nickname: string
		parents: string
		instagram?: string
	}
	prayer: string
	events: EventModel[]
	story: StoryModel[]
	gallery: ImageModel[]
	gifts: GiftAccountModel[]
	wishes: WishModel[]
	footerGreeting: string
}

export interface InviteeViewModel {
	id: string
	name: string
	status: 'pending' | 'attending' | 'declined'
}

