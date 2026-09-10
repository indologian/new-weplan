import { describe, expect, it } from "vitest";
import { interactionConfigSchema } from "./interaction-config";

describe("interaction config validation", () => {
	it.each([
		{ rsvpEnabled: true, wishesEnabled: true },
		{ rsvpEnabled: true, wishesEnabled: false },
		{ rsvpEnabled: false, wishesEnabled: true },
		{ rsvpEnabled: false, wishesEnabled: false },
	])(
		"accepts independent boolean combination $rsvpEnabled/$wishesEnabled",
		(input) => {
			expect(interactionConfigSchema.parse(input)).toEqual(input);
		},
	);

	it.each([
		{ rsvpEnabled: "true", wishesEnabled: true },
		{ rsvpEnabled: 1, wishesEnabled: true },
		{ rsvpEnabled: null, wishesEnabled: false },
		{ rsvpEnabled: true },
	])("rejects non-boolean or missing values", (input) => {
		expect(interactionConfigSchema.safeParse(input).success).toBe(false);
	});

	it("strips unrelated fields from validated data", () => {
		expect(
			interactionConfigSchema.parse({
				rsvpEnabled: true,
				wishesEnabled: false,
				status: "published",
				slug: "not-allowed",
			}),
		).toEqual({ rsvpEnabled: true, wishesEnabled: false });
	});
});
