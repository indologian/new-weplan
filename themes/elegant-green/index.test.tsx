import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mockInvitation, mockInvitee } from "../fixtures";
import { ElegantGreenTheme } from ".";

describe("ElegantGreenTheme", () => {
	it("accepts and renders the common invitation view model", () => {
		const markup = renderToStaticMarkup(
			<ElegantGreenTheme invitation={mockInvitation} invitee={mockInvitee} />,
		);

		expect(markup).toContain(mockInvitation.groom.nickname);
		expect(markup).toContain(mockInvitee.name);
	});
});
