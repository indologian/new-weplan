import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
	mapPublicInvitationViewModel,
	mapPublicInvitee,
} from "./public-view-model";

describe("public invitation view model", () => {
	it("replaces database IDs and removes invalid map coordinates", () => {
		const invitation = mapPublicInvitationViewModel(
			{
				ownerId: "owner-db-id",
				rendererKey: "elegant-green",
				invitation: {
					id: "invitation-db-id",
					slug: "public-slug",
					groomName: "Groom",
					groomFatherName: null,
					groomMotherName: null,
					groomPhotoPath: null,
					brideName: "Bride",
					brideFatherName: null,
					brideMotherName: null,
					bridePhotoPath: null,
					coverPhotoPath: null,
					musicPath: null,
					openingGreeting: null,
					prayerText: null,
					rsvpEnabled: true,
					wishesEnabled: true,
				},
				events: [
					{
						id: "event-db-id",
						name: "Main",
						eventDate: "2027-01-01",
						startTime: "09:00",
						endTime: null,
						untilFinished: true,
						address: "Venue",
						latitude: 999,
						longitude: 999,
						isMainEvent: true,
					},
				],
				stories: [],
				gallery: [],
				gifts: [],
				signedUrls: {},
			},
			[{ name: "Guest", message: "Wish", createdAt: "2026-01-01" }],
		);
		expect(invitation.id).toBe("invitation-public-slug");
		expect(invitation.events[0]).toMatchObject({
			id: "event-0",
			mapsUrl: undefined,
		});
		expect(JSON.stringify(invitation)).not.toContain("db-id");
		expect(mapPublicInvitee("Same Name")).toEqual({
			id: "invitee",
			name: "Same Name",
			status: "pending",
		});
	});
});
