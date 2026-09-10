import { describe, expect, it } from "vitest";
import {
	getCanonicalMusicExtension,
	getInvitationMusicPath,
} from "./invitation-music";

describe("invitation music storage", () => {
	const coupleId = "00000000-0000-4000-8000-000000000010";
	const invitationId = "00000000-0000-4000-8000-000000000100";

	it("builds the server-authoritative canonical path", () => {
		expect(getInvitationMusicPath(coupleId, invitationId, "m4a")).toBe(
			`${coupleId}/${invitationId}/audio/background.m4a`,
		);
	});

	it("accepts only a canonical path for the owned invitation", () => {
		expect(
			getCanonicalMusicExtension(
				`${coupleId}/${invitationId}/audio/background.wav`,
				coupleId,
				invitationId,
			),
		).toBe("wav");
		expect(
			getCanonicalMusicExtension(
				`other/${invitationId}/audio/background.wav`,
				coupleId,
				invitationId,
			),
		).toBeNull();
	});
});
