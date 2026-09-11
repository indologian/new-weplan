import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mockInvitation, mockInvitee } from "../../fixtures";
import { Rsvp } from "./rsvp";
import { Wishes } from "./wishes";

describe("Elegant Green interaction slots", () => {
	it("renders the supplied RSVP capability", () => {
		const markup = renderToStaticMarkup(
			<Rsvp invitee={mockInvitee} interaction={<p>Live RSVP</p>} />,
		);
		expect(markup).toContain("Live RSVP");
		expect(markup).not.toContain(">Accept<");
	});

	it("renders the supplied Wishes capability", () => {
		const markup = renderToStaticMarkup(
			<Wishes invitation={mockInvitation} interaction={<p>Live Wishes</p>} />,
		);
		expect(markup).toContain("Live Wishes");
	});

	it("escapes persisted Wish HTML when using presentation fallback", () => {
		const invitation = {
			...mockInvitation,
			wishes: [
				{
					id: "wish",
					name: "Guest",
					message: "<script>alert(1)</script>",
					createdAt: "2026-01-01T00:00:00.000Z",
				},
			],
		};
		const markup = renderToStaticMarkup(<Wishes invitation={invitation} />);
		expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(markup).not.toContain("<script>");
	});
});
