import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { InvitationViewModel } from "../../../types/theme";
import { PrivatePreview } from "./private-preview";

const persistedPreview: InvitationViewModel = {
	id: "owned-invitation",
	slug: "persisted-preview",
	theme: { rendererKey: "elegant-green" },
	rsvpEnabled: true,
	wishesEnabled: true,
	greeting: "Persisted greeting",
	weddingDate: "",
	groom: { name: "Groom", nickname: "Groom", parents: "Parents" },
	bride: { name: "Bride", nickname: "Bride", parents: "Parents" },
	prayer: "Persisted prayer",
	events: [],
	story: [],
	gallery: [],
	gifts: [],
	wishes: [],
	footerGreeting: "Thank you",
};

describe("private builder preview", () => {
	it("uses the registry renderer and does not autoplay music on render", () => {
		const markup = renderToStaticMarkup(
			<PrivatePreview
				invitation={{
					...persistedPreview,
					musicUrl: "https://signed.test/music",
				}}
				themeSlug="elegant-green"
			/>,
		);
		expect(markup).toContain("Open Invitation");
		expect(markup).toContain("Putar musik");
		expect(markup).not.toContain("autoplay");
		expect(markup).not.toContain("guestToken");
	});

	it("fails closed for an unknown renderer", () => {
		const markup = renderToStaticMarkup(
			<PrivatePreview
				invitation={{
					...persistedPreview,
					theme: { rendererKey: "unknown-renderer" },
				}}
				themeSlug="unknown"
			/>,
		);
		expect(markup).toBe("");
	});
});
