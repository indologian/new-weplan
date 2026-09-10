import { z } from "zod";

export const MAX_MUSIC_FILE_SIZE = 9 * 1024 * 1024;

export const musicInvitationIdSchema = z.string().uuid();

export const musicMimeTypes = {
	mp3: ["audio/mpeg"],
	m4a: ["audio/mp4", "audio/x-m4a"],
	ogg: ["audio/ogg"],
	wav: ["audio/wav", "audio/x-wav", "audio/wave"],
} as const;

export type MusicExtension = keyof typeof musicMimeTypes;

export type MusicMetadata = {
	filename: string;
	mimeType: string;
	size: number;
};

export type ValidatedMusicMetadata = MusicMetadata & {
	extension: MusicExtension;
};

const musicMetadataSchema = z.object({
	filename: z.string().trim().min(1),
	mimeType: z.string().trim().toLowerCase().min(1),
	size: z.number().int().nonnegative().max(MAX_MUSIC_FILE_SIZE),
});

export function parseMusicMetadata(input: unknown): ValidatedMusicMetadata {
	const parsed = musicMetadataSchema.safeParse(input);
	if (!parsed.success) throw new Error("File audio tidak valid.");

	const match = /\.([^.\\/]+)$/.exec(parsed.data.filename);
	const extension = match?.[1]?.toLowerCase() as MusicExtension | undefined;
	if (!extension || !(extension in musicMimeTypes)) {
		throw new Error("Format audio tidak didukung.");
	}

	const allowedMimeTypes: readonly string[] = musicMimeTypes[extension];
	if (!allowedMimeTypes.includes(parsed.data.mimeType)) {
		throw new Error("Tipe audio tidak sesuai dengan ekstensi file.");
	}

	return { ...parsed.data, extension };
}
