import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { InvitationViewModel } from "../../../types/theme";
import {
	PublicInvitationRenderer,
	playInvitationMusic,
} from "./public-invitation-renderer";

const invitation = {
	id: "public",
	slug: "slug",
	theme: { rendererKey: "elegant-green" },
	musicUrl: "https://signed.test/music",
	rsvpEnabled: false,
	wishesEnabled: false,
	greeting: "",
	weddingDate: "",
	groom: { name: "G", nickname: "G", parents: "" },
	bride: { name: "B", nickname: "B", parents: "" },
	prayer: "",
	events: [],
	story: [],
	gallery: [],
	gifts: [],
	wishes: [],
	footerGreeting: "",
} satisfies InvitationViewModel;

describe("public invitation music", () => {
	it("renders without autoplay", () => {
		const markup = renderToStaticMarkup(
			<PublicInvitationRenderer
				invitation={invitation}
				invitee={{ id: "invitee", name: "Guest", status: "pending" }}
				guestToken={"A".repeat(43)}
			/>,
		);
		expect(markup).toContain("<audio");
		expect(markup).not.toContain("autoplay");
		expect(markup).not.toContain("A".repeat(43));
	});
	it("plays only when explicit helper is invoked and tolerates rejection", async () => {
		const play = vi.fn().mockRejectedValue(new Error("blocked"));
		await expect(playInvitationMusic({ play })).resolves.toBeUndefined();
		expect(play).toHaveBeenCalledOnce();
	});
});
