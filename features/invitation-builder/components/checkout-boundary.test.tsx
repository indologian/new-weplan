import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../actions/payments/checkout", () => ({
	startPaymentCheckout: vi.fn(),
}));

import { CheckoutBoundary } from "./checkout-boundary";

describe("checkout boundary", () => {
	it("carries only invitationId and exposes the checkout CTA", () => {
		const markup = renderToStaticMarkup(
			<CheckoutBoundary invitationId="invitation-1" />,
		);
		expect(markup).toContain('data-checkout-invitation-id="invitation-1"');
		expect(markup).toContain("Bayar &amp; Publish");
		expect(markup).toContain("diverifikasi melalui Midtrans");
		expect(markup).not.toContain("price");
		expect(markup).not.toContain("tier");
	});
});
