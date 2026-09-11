import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicRsvp, rsvpEndpoint } from "./public-rsvp";

describe("public RSVP interaction", () => {
	it("builds only the approved token endpoint", () => {
		expect(rsvpEndpoint("token/value")).toBe("/api/invite/token%2Fvalue/rsvp");
	});

	it("renders RSVP controls without exposing token text", () => {
		const token = "A".repeat(43);
		const markup = renderToStaticMarkup(<PublicRsvp guestToken={token} />);
		expect(markup).toContain("Kirim RSVP");
		expect(markup).toContain("Jumlah tamu");
		expect(markup).not.toContain(token);
	});
});
