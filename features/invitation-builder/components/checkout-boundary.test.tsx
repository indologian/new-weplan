import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckoutBoundary } from "./checkout-boundary";

describe("checkout boundary", () => {
	it("carries only invitationId and does not pretend checkout succeeded", () => {
		const markup = renderToStaticMarkup(
			<CheckoutBoundary invitationId="invitation-1" />,
		);
		expect(markup).toContain('data-checkout-invitation-id="invitation-1"');
		expect(markup).toContain("disabled");
		expect(markup).toContain("Checkout belum tersedia");
		expect(markup).not.toContain("price");
		expect(markup).not.toContain("tier");
	});
});
