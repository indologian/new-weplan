export type MusicPlaybackTarget = {
	paused: boolean;
	play: () => Promise<void>;
	pause: () => void;
};

export async function toggleMusicPlayback(target: MusicPlaybackTarget) {
	if (target.paused) {
		await target.play();
		return true;
	}
	target.pause();
	return false;
}
