import { describe, expect, it } from "vitest";
import {
	getInvitationPhotoDestination,
	parseInvitationPhotoType,
} from "./invitation-photo";

describe("invitation photo storage", () => {
	it.each([
		["cover", "owner/invitation/cover/cover.webp", "cover_photo_path"],
		["groom", "owner/invitation/couple/groom.webp", "groom_photo_path"],
		["bride", "owner/invitation/couple/bride.webp", "bride_photo_path"],
	] as const)("builds canonical %s destination", (type, path, column) => {
		const parsedType = parseInvitationPhotoType(type);
		expect(
			getInvitationPhotoDestination("owner", "invitation", parsedType),
		).toEqual({ column, path });
	});

	it.each(["gallery", "../cover", "", null, undefined])(
		"rejects invalid photo type %s",
		(type) => {
			expect(() => parseInvitationPhotoType(type)).toThrow(
				"Jenis foto tidak valid.",
			);
		},
	);
});
