import { describe, expect, it } from "vitest";
import {
	MAX_MUSIC_FILE_SIZE,
	musicMimeTypes,
	parseMusicMetadata,
} from "./music";

describe("music metadata validation", () => {
	it("accepts the exact 9 MB boundary", () => {
		expect(
			parseMusicMetadata({
				filename: "background.mp3",
				mimeType: "audio/mpeg",
				size: MAX_MUSIC_FILE_SIZE,
			}),
		).toMatchObject({ extension: "mp3", size: MAX_MUSIC_FILE_SIZE });
	});

	it("rejects a file larger than 9 MB", () => {
		expect(() =>
			parseMusicMetadata({
				filename: "background.mp3",
				mimeType: "audio/mpeg",
				size: MAX_MUSIC_FILE_SIZE + 1,
			}),
		).toThrow("tidak valid");
	});

	for (const [extension, mimeTypes] of Object.entries(musicMimeTypes)) {
		for (const mimeType of mimeTypes) {
			it(`accepts .${extension} with ${mimeType}`, () => {
				expect(
					parseMusicMetadata({
						filename: `song.${extension}`,
						mimeType,
						size: 1024,
					}),
				).toMatchObject({ extension, mimeType });
			});
		}
	}

	it("rejects mismatched MIME and extension", () => {
		expect(() =>
			parseMusicMetadata({
				filename: "song.mp3",
				mimeType: "audio/ogg",
				size: 1024,
			}),
		).toThrow("tidak sesuai");
	});

	it.each([
		["song.flac", "audio/flac"],
		["song.mp4", "video/mp4"],
		["payload.exe", "application/octet-stream"],
		["page.html", "text/html"],
	])("rejects unsupported file %s", (filename, mimeType) => {
		expect(() =>
			parseMusicMetadata({ filename, mimeType, size: 10 }),
		).toThrow();
	});

	it("ignores an arbitrary client path", () => {
		expect(
			parseMusicMetadata({
				filename: "song.ogg",
				mimeType: "audio/ogg",
				size: 10,
				path: "someone-else/invitation/audio/background.ogg",
			}),
		).not.toHaveProperty("path");
	});
});
