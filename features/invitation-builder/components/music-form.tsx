"use client";

import { useEffect, useRef, useState } from "react";
import {
	createMusicPreviewUrl,
	createMusicUploadUrl,
	getMusicState,
	persistUploadedMusic,
	removeMusic,
} from "@/actions/invitations/music";
import { parseMusicMetadata } from "@/validations/music";
import { toggleMusicPlayback } from "../utils/music-playback";

const acceptedAudio = [
	".mp3",
	".m4a",
	".ogg",
	".wav",
	"audio/mpeg",
	"audio/mp4",
	"audio/x-m4a",
	"audio/ogg",
	"audio/wav",
	"audio/x-wav",
	"audio/wave",
].join(",");

export function MusicForm({ invitationId }: { invitationId: string }) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [hasMusic, setHasMusic] = useState<boolean | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const loadPreview = async () => {
		const preview = await createMusicPreviewUrl(invitationId);
		setPreviewUrl(preview.signedUrl);
	};

	useEffect(() => {
		let active = true;
		setHasMusic(null);
		setPreviewUrl(null);
		setError(null);
		getMusicState(invitationId)
			.then(async ({ hasMusic: persistedMusic }) => {
				if (!active) return;
				setHasMusic(persistedMusic);
				if (persistedMusic) {
					const preview = await createMusicPreviewUrl(invitationId);
					if (active) setPreviewUrl(preview.signedUrl);
				}
			})
			.catch((loadError: Error) => {
				if (active) setError(loadError.message);
			});
		return () => {
			active = false;
		};
	}, [invitationId]);

	const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setIsBusy(true);
		setError(null);
		setMessage(null);
		try {
			const metadata = parseMusicMetadata({
				filename: file.name,
				mimeType: file.type,
				size: file.size,
			});
			const { signedUrl } = await createMusicUploadUrl(invitationId, metadata);
			const response = await fetch(signedUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": metadata.mimeType },
			});
			if (!response.ok) throw new Error("Gagal mengunggah audio.");

			const result = await persistUploadedMusic(invitationId, metadata);
			setHasMusic(true);
			setIsPlaying(false);
			await loadPreview();
			setMessage(
				result.cleanupWarning ?? "Background audio berhasil disimpan.",
			);
		} catch (uploadError) {
			setError((uploadError as Error).message);
		} finally {
			setIsBusy(false);
			event.target.value = "";
		}
	};

	const handleRemove = async () => {
		setIsBusy(true);
		setError(null);
		setMessage(null);
		try {
			audioRef.current?.pause();
			await removeMusic(invitationId);
			setHasMusic(false);
			setPreviewUrl(null);
			setIsPlaying(false);
			setMessage("Background audio berhasil dihapus.");
		} catch (removeError) {
			setError((removeError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<section
			id="music-step"
			className="rounded-lg border border-border bg-card p-6 shadow-sm"
			aria-labelledby="music-title"
		>
			<h2 id="music-title" className="text-xl font-bold">
				Background Music
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				Pilih satu file MP3, M4A, OGG, atau WAV dengan ukuran maksimal 9 MB.
			</p>

			<div className="mt-5 space-y-4">
				<input
					type="file"
					accept={acceptedAudio}
					disabled={isBusy}
					onChange={handleUpload}
				/>

				{hasMusic === null && !error && (
					<p className="text-sm text-muted-foreground">
						Memuat audio tersimpan...
					</p>
				)}
				{hasMusic && (
					<div className="flex flex-wrap gap-3">
						<button
							type="button"
							disabled={isBusy || !previewUrl}
							className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
							onClick={async () => {
								if (!audioRef.current) return;
								try {
									setIsPlaying(await toggleMusicPlayback(audioRef.current));
								} catch {
									setError("Browser tidak dapat memutar preview audio.");
								}
							}}
						>
							{isPlaying ? "Pause preview" : "Putar preview"}
						</button>
						<button
							type="button"
							disabled={isBusy}
							className="rounded-md border border-destructive px-4 py-2 font-semibold text-destructive disabled:opacity-50"
							onClick={handleRemove}
						>
							Hapus audio
						</button>
					</div>
				)}

				{/* biome-ignore lint/a11y/useMediaCaption: instrumental background preview has no dialogue or caption track */}
				<audio
					ref={audioRef}
					src={previewUrl ?? undefined}
					preload="metadata"
					onEnded={() => setIsPlaying(false)}
				/>
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
				{message && (
					<p role="status" className="text-sm text-success">
						{message}
					</p>
				)}
			</div>
		</section>
	);
}
