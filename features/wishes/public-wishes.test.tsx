import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicWishes, wishEndpoint, wishesEndpoint } from "./public-wishes";

describe("public Wishes interaction", () => {
	it("uses only approved token endpoints", () => {
		expect(wishesEndpoint("token/value")).toBe(
			"/api/invite/token%2Fvalue/wishes",
		);
		expect(wishEndpoint("token/value")).toBe("/api/invite/token%2Fvalue/wish");
	});

	it("renders escaped interaction UI without token text", () => {
		const token = "A".repeat(43);
		const markup = renderToStaticMarkup(<PublicWishes guestToken={token} />);
		expect(markup).toContain("Ucapan Anda");
		expect(markup).toContain("0/500 karakter");
		expect(markup).not.toContain(token);
		expect(markup).not.toContain("dangerouslySetInnerHTML");
	});
});
