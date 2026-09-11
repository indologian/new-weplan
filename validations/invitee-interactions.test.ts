import { describe, expect, it } from "vitest";
import {
	inviteeTokenSchema,
	rsvpRequestSchema,
	wishRequestSchema,
} from "./invitee-interactions";

describe("invitee interaction validation", () => {
	it("accepts only the 43-character URL-safe token representation", () => {
		expect(inviteeTokenSchema.safeParse("A".repeat(43)).success).toBe(true);
		for (const token of ["short", "A".repeat(42), `${"A".repeat(42)}!`]) {
			expect(inviteeTokenSchema.safeParse(token).success).toBe(false);
		}
	});

	it("validates attending counts and rejects numeric strings or extra fields", () => {
		expect(
			rsvpRequestSchema.safeParse({ attendance: "attending", guestCount: 2 })
				.success,
		).toBe(true);
		for (const input of [
			{ attendance: "attending", guestCount: 0 },
			{ attendance: "attending", guestCount: "2" },
			{ attendance: "attending", guestCount: 2, guestId: "foreign" },
		]) {
			expect(rsvpRequestSchema.safeParse(input).success).toBe(false);
		}
	});

	it("normalizes not-attending count to zero", () => {
		expect(
			rsvpRequestSchema.parse({ attendance: "not_attending", guestCount: 99 }),
		).toEqual({ attendance: "not_attending", guestCount: 0 });
	});

	it("trims and limits Wishes by Unicode code points", () => {
		expect(wishRequestSchema.parse({ message: "  Selamat  " })).toEqual({
			message: "Selamat",
		});
		expect(
			wishRequestSchema.parse({ message: "🎉".repeat(500) }).message,
		).toHaveLength(1000);
		expect(
			wishRequestSchema.safeParse({ message: "🎉".repeat(501) }).success,
		).toBe(false);
		expect(wishRequestSchema.safeParse({ message: "   " }).success).toBe(false);
		expect(
			wishRequestSchema.safeParse({ message: "ok", invitationId: "foreign" })
				.success,
		).toBe(false);
	});
});
