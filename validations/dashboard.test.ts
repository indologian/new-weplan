import { describe, expect, it } from "vitest";
import {
	dashboardChildIdSchema,
	dashboardGuestNameSchema,
	dashboardInvitationIdSchema,
	dashboardSectionSchema,
} from "./dashboard";

describe("dashboard validation", () => {
	it("accepts UUID identifiers and known sections", () => {
		expect(
			dashboardInvitationIdSchema.safeParse(
				"00000000-0000-4000-8000-000000000100",
			).success,
		).toBe(true);
		expect(
			dashboardChildIdSchema.safeParse("00000000-0000-4000-8000-000000000200")
				.success,
		).toBe(true);
		expect(dashboardSectionSchema.safeParse("guests").success).toBe(true);
	});

	it("rejects invalid identifiers and unknown sections", () => {
		expect(dashboardInvitationIdSchema.safeParse("not-an-id").success).toBe(
			false,
		);
		expect(dashboardSectionSchema.safeParse("payments").success).toBe(false);
	});

	it("trims valid guest names while allowing duplicates", () => {
		expect(dashboardGuestNameSchema.parse("  Tamu Sama  ")).toBe("Tamu Sama");
		expect(dashboardGuestNameSchema.parse("Tamu Sama")).toBe("Tamu Sama");
		expect(dashboardGuestNameSchema.safeParse("   ").success).toBe(false);
	});
});
