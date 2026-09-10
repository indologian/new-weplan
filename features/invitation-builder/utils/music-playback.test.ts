import { describe, expect, it, vi } from "vitest";
import { toggleMusicPlayback } from "./music-playback";

describe("music preview playback", () => {
	it("does not play merely because a playback target exists", () => {
		const play = vi.fn(async () => undefined);
		const target = { paused: true, play, pause: vi.fn() };
		expect(target).toBeDefined();
		expect(play).not.toHaveBeenCalled();
	});

	it("starts playback only when the explicit gesture handler is invoked", async () => {
		const play = vi.fn(async () => undefined);
		const target = { paused: true, play, pause: vi.fn() };
		await expect(toggleMusicPlayback(target)).resolves.toBe(true);
		expect(play).toHaveBeenCalledOnce();
	});

	it("pauses an already-playing preview", async () => {
		const pause = vi.fn();
		const target = { paused: false, play: vi.fn(), pause };
		await expect(toggleMusicPlayback(target)).resolves.toBe(false);
		expect(pause).toHaveBeenCalledOnce();
		expect(target.play).not.toHaveBeenCalled();
	});
});
