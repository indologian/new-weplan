import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	createMusicPreviewUrl,
	createMusicUploadUrl,
	getMusicState,
	persistUploadedMusic,
	removeMusic,
} from "./music";
import { MusicTestDatabase } from "./music-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";
const mp3Path = `${ownerId}/${invitationId}/audio/background.mp3`;
const oggPath = `${ownerId}/${invitationId}/audio/background.ogg`;
const mp3 = { filename: "first-dance.mp3", mimeType: "audio/mpeg", size: 10 };
const ogg = { filename: "first-dance.ogg", mimeType: "audio/ogg", size: 20 };

describe("music actions", () => {
	let database: MusicTestDatabase;

	beforeEach(() => {
		database = new MusicTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		mocks.requireAuthenticatedMutation.mockReset();
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("rejects unauthenticated upload authorization", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValue(new Error("Login"));
		await expect(createMusicUploadUrl(invitationId, mp3)).rejects.toThrow(
			"Login",
		);
		expect(database.signedUploadPaths).toEqual([]);
	});

	it("rejects cross-owner upload before touching Storage", async () => {
		await expect(createMusicUploadUrl(otherInvitationId, mp3)).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(database.signedUploadPaths).toEqual([]);
	});

	it("issues upload authorization only for the canonical server path", async () => {
		await expect(
			createMusicUploadUrl(invitationId, {
				...mp3,
				path: "foreign/invitation/audio/background.mp3",
			}),
		).resolves.toHaveProperty("signedUrl");
		expect(database.signedUploadPaths).toEqual([mp3Path]);
	});

	it("does not persist when the upload object is absent", async () => {
		await expect(persistUploadedMusic(invitationId, mp3)).rejects.toThrow(
			"belum berhasil",
		);
		expect(database.updatePayloads).toEqual([]);
	});

	it("rejects cross-owner persistence without touching Storage", async () => {
		await expect(persistUploadedMusic(otherInvitationId, mp3)).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(database.updatePayloads).toEqual([]);
		expect(database.removedPaths).toEqual([]);
	});

	it("rejects uploaded object metadata that differs from the approved type", async () => {
		database.objects.set(mp3Path, { size: 10, contentType: "video/mp4" });
		await expect(persistUploadedMusic(invitationId, mp3)).rejects.toThrow(
			"tidak sesuai",
		);
		expect(database.updatePayloads).toEqual([]);
	});

	it("persists only the canonical path after a verified upload", async () => {
		database.objects.set(mp3Path, { size: 10, contentType: "audio/mpeg" });
		await expect(
			persistUploadedMusic(invitationId, {
				...mp3,
				musicPath: "foreign/path.mp3",
			}),
		).resolves.toEqual({ hasMusic: true, cleanupWarning: null });
		expect(database.updatePayloads).toEqual([{ music_path: mp3Path }]);
		await expect(getMusicState(invitationId)).resolves.toEqual({
			hasMusic: true,
		});
	});

	it("replaces the same extension without deleting the canonical object", async () => {
		database.invitations[0].music_path = mp3Path;
		database.objects.set(mp3Path, { size: 10, contentType: "audio/mpeg" });
		await persistUploadedMusic(invitationId, mp3);
		expect(database.removedPaths).toEqual([]);
		expect(database.invitations[0].music_path).toBe(mp3Path);
	});

	it("persists a different extension before cleaning the stale object", async () => {
		database.invitations[0].music_path = mp3Path;
		database.objects.set(mp3Path, { size: 10, contentType: "audio/mpeg" });
		database.objects.set(oggPath, { size: 20, contentType: "audio/ogg" });
		await expect(persistUploadedMusic(invitationId, ogg)).resolves.toEqual({
			hasMusic: true,
			cleanupWarning: null,
		});
		expect(database.invitations[0].music_path).toBe(oggPath);
		expect(database.removedPaths).toEqual([[mp3Path]]);
	});

	it("keeps new music authoritative when stale cleanup fails", async () => {
		database.invitations[0].music_path = mp3Path;
		database.objects.set(mp3Path, { size: 10, contentType: "audio/mpeg" });
		database.objects.set(oggPath, { size: 20, contentType: "audio/ogg" });
		database.removeError = { status: 500 };
		const result = await persistUploadedMusic(invitationId, ogg);
		expect(result.cleanupWarning).toContain("audio lama gagal");
		expect(database.invitations[0].music_path).toBe(oggPath);
	});

	it("removes current music and clears the persisted reference", async () => {
		database.invitations[0].music_path = mp3Path;
		database.objects.set(mp3Path, { size: 10, contentType: "audio/mpeg" });
		await expect(removeMusic(invitationId)).resolves.toEqual({
			hasMusic: false,
		});
		expect(database.removedPaths).toEqual([[mp3Path]]);
		expect(database.invitations[0].music_path).toBeNull();
	});

	it("clears a reference when the Storage object is already missing", async () => {
		database.invitations[0].music_path = mp3Path;
		database.removeError = { statusCode: "404" };
		await expect(removeMusic(invitationId)).resolves.toEqual({
			hasMusic: false,
		});
		expect(database.invitations[0].music_path).toBeNull();
	});

	it("rejects cross-owner removal without touching Storage", async () => {
		database.invitations[1].music_path = `${otherOwnerId}/${otherInvitationId}/audio/background.mp3`;
		await expect(removeMusic(otherInvitationId)).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(database.removedPaths).toEqual([]);
	});

	it("creates a temporary signed preview only for the owner", async () => {
		database.invitations[0].music_path = mp3Path;
		const beforeUpdates = database.updatePayloads.length;
		await expect(createMusicPreviewUrl(invitationId)).resolves.toEqual({
			signedUrl: "https://storage.test/read?signature=temporary",
			expiresIn: 3600,
		});
		expect(database.signedReadPaths).toEqual([
			{ path: mp3Path, expiresIn: 3600 },
		]);
		expect(database.updatePayloads).toHaveLength(beforeUpdates);
	});

	it("rejects cross-owner signed preview", async () => {
		database.invitations[1].music_path = `${otherOwnerId}/${otherInvitationId}/audio/background.mp3`;
		await expect(createMusicPreviewUrl(otherInvitationId)).rejects.toThrow(
			"Tidak memiliki akses",
		);
		expect(database.signedReadPaths).toEqual([]);
	});
});
