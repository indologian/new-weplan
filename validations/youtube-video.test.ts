import { describe, expect, it } from "vitest";
import { normalizeYouTubeVideoId } from "./youtube-video";

const videoId = "dQw4w9WgXcQ";

describe("YouTube normalization", () => {
	it.each([
		videoId,
		`https://youtube.com/watch?v=${videoId}`,
		`https://www.youtube.com/watch?v=${videoId}&feature=share`,
		`https://youtu.be/${videoId}`,
		`https://youtube.com/shorts/${videoId}`,
		`https://youtube.com/embed/${videoId}`,
	])("normalizes supported input %s", (input) => {
		expect(normalizeYouTubeVideoId(input)).toBe(videoId);
	});

	it.each([
		"",
		"not_video",
		"https://evil.test/watch?v=dQw4w9WgXcQ",
		"http://youtube.com/watch?v=dQw4w9WgXcQ",
		'<iframe src="https://youtube.com/embed/dQw4w9WgXcQ"></iframe>',
		"https://youtube.com/watch?v=too-short",
		"https://youtube.com/channel/dQw4w9WgXcQ",
	])("rejects unsafe or malformed input %s", (input) => {
		expect(() => normalizeYouTubeVideoId(input)).toThrow(
			"Video YouTube tidak valid",
		);
	});
});
