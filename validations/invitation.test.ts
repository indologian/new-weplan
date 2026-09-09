import { describe, expect, it } from "vitest";
import { invitationSlugSchema, step1IdentitySchema } from "./invitation";

describe("invitation validation", () => {
	it.each(["andi-siti", "couple-2026", "abc"])(
		"accepts valid slug %s",
		(slug) => {
			expect(invitationSlugSchema.safeParse(slug).success).toBe(true);
		},
	);

	it.each(["ABCD", "a b", "ab", "a/b", "a_b"])(
		"rejects invalid slug %s",
		(slug) => {
			expect(invitationSlugSchema.safeParse(slug).success).toBe(false);
		},
	);

	it("requires both couple names", () => {
		const result = step1IdentitySchema.safeParse({
			slug: "andi-siti",
			groom_name: "",
			bride_name: "",
		});

		expect(result.success).toBe(false);
	});
});
