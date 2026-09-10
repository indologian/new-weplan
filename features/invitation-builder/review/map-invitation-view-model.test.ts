import { describe, expect, it } from "vitest";
import { mapInvitationViewModel } from "./map-invitation-view-model";

describe("persisted invitation preview mapping", () => {
	it("maps ordered persisted content and signed presentation URLs", () => {
		const ownerId = "00000000-0000-4000-8000-000000000010";
		const invitationId = "00000000-0000-4000-8000-000000000100";
		const storyId = "00000000-0000-4000-8000-000000000201";
		const galleryId = "00000000-0000-4000-8000-000000000301";
		const storyPath = `${ownerId}/${invitationId}/stories/${storyId}.webp`;
		const galleryPath = `${ownerId}/${invitationId}/gallery/${galleryId}.webp`;
		const musicPath = `${ownerId}/${invitationId}/audio/background.mp3`;
		const model = mapInvitationViewModel({
			ownerId,
			rendererKey: "elegant-green",
			invitation: {
				id: invitationId,
				slug: "persisted-couple",
				groomName: "Groom persisted",
				groomFatherName: "Father",
				groomMotherName: "Mother",
				groomPhotoPath: null,
				brideName: "Bride persisted",
				brideFatherName: null,
				brideMotherName: null,
				bridePhotoPath: null,
				coverPhotoPath: null,
				musicPath,
				openingGreeting: "Persisted greeting",
				prayerText: "Persisted prayer",
				rsvpEnabled: false,
				wishesEnabled: true,
			},
			events: [
				{
					id: "event-1",
					name: "Main event",
					eventDate: "2027-01-02",
					startTime: "09:00",
					endTime: null,
					untilFinished: true,
					address: "Persisted address",
					latitude: -6.2,
					longitude: 106.8,
					isMainEvent: true,
				},
			],
			stories: [
				{
					id: storyId,
					title: "Persisted story",
					storyDate: null,
					description: "Story body",
					imagePath: storyPath,
				},
			],
			gallery: [
				{
					id: galleryId,
					type: "image",
					imagePath: galleryPath,
					youtubeVideoId: null,
				},
				{
					id: "video-1",
					type: "youtube",
					imagePath: null,
					youtubeVideoId: "abcdefghijk",
				},
			],
			gifts: [
				{
					id: "gift-1",
					bankName: "Bank",
					accountNumber: "001234",
					accountHolder: "Owner",
				},
			],
			signedUrls: {
				[storyPath]: "https://signed.test/story",
				[galleryPath]: "https://signed.test/gallery",
				[musicPath]: "https://signed.test/music",
			},
		});

		expect(model.slug).toBe("persisted-couple");
		expect(model.greeting).toBe("Persisted greeting");
		expect(model.events[0]).toMatchObject({ isMainEvent: true });
		expect(model.story[0]).toMatchObject({
			date: null,
			imageUrl: "https://signed.test/story",
		});
		expect(model.gallery).toEqual([
			{
				id: galleryId,
				type: "image",
				url: "https://signed.test/gallery",
				alt: "Wedding gallery",
			},
			{ id: "video-1", type: "youtube", videoId: "abcdefghijk" },
		]);
		expect(model.gifts[0].accountNumber).toBe("001234");
		expect(model.rsvpEnabled).toBe(false);
		expect(model.wishesEnabled).toBe(true);
		expect(model.musicUrl).toBe("https://signed.test/music");
		expect(JSON.stringify(model)).not.toContain(`${ownerId}/${invitationId}`);
	});
});
