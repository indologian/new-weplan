import type { InvitationViewModel, InviteeViewModel } from "../types/theme";

export const mockInvitation: InvitationViewModel = {
	id: "inv-001",
	slug: "john-jane",
	theme: {
		rendererKey: "elegant-green",
	},
	rsvpEnabled: true,
	wishesEnabled: true,
	greeting:
		"By the grace of God, we joyfully invite you to celebrate our union.",
	weddingDate: "2026-12-25T08:00:00Z",
	groom: {
		name: "Johnathan Doe",
		nickname: "John",
		parents: "Mr. Doe & Mrs. Doe",
		instagram: "https://instagram.com/johndoe",
	},
	bride: {
		name: "Jane Smith",
		nickname: "Jane",
		parents: "Mr. Smith & Mrs. Smith",
		instagram: "https://instagram.com/janesmith",
	},
	prayer:
		"And among His signs is this, that He created for you mates from among yourselves...",
	events: [
		{
			id: "ev-01",
			isMainEvent: true,
			title: "Holy Matrimony",
			date: "2026-12-25T08:00:00Z",
			time: "08:00 AM - 10:00 AM",
			locationName: "Grand Cathedral",
			locationAddress: "123 Holy St, Cityville",
			mapsUrl: "https://maps.google.com",
		},
		{
			id: "ev-02",
			isMainEvent: false,
			title: "Wedding Reception",
			date: "2026-12-25T11:00:00Z",
			time: "11:00 AM - 02:00 PM",
			locationName: "Cityville Grand Hotel",
			locationAddress: "456 Hotel Ave, Cityville",
			mapsUrl: "https://maps.google.com",
		},
	],
	story: [
		{
			id: "st-01",
			date: "January 2020",
			title: "First Met",
			description: "We met at a coffee shop downtown.",
		},
		{
			id: "st-02",
			date: "February 2025",
			title: "The Proposal",
			description: "John proposed under the stars.",
		},
	],
	gallery: [
		{
			id: "img-1",
			type: "image",
			url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
			alt: "Prewedding 1",
		},
		{
			id: "img-2",
			type: "image",
			url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed",
			alt: "Prewedding 2",
		},
		{
			id: "img-3",
			type: "image",
			url: "https://images.unsplash.com/photo-1606800052052-a08af7148866",
			alt: "Prewedding 3",
		},
	],
	gifts: [
		{
			id: "gft-01",
			provider: "Bank Central Asia (BCA)",
			accountNumber: "1234567890",
			accountName: "Johnathan Doe",
		},
	],
	wishes: [
		{
			id: "wsh-01",
			name: "Alice",
			message: "Happy wedding! Wishing you a lifetime of joy.",
			createdAt: "2026-09-01T10:00:00Z",
		},
	],
	footerGreeting: "Thank you for your love and support.",
};

export const mockInvitee: InviteeViewModel = {
	id: "invt-001",
	name: "Dear Guest",
	status: "pending",
};
