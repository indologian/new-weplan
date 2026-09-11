import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InvitationsSection } from "./invitations-section";

describe("dashboard invitation navigation", () => {
	it("presents persisted status and reuses builder/private preview routes", () => {
		const markup = renderToStaticMarkup(
			<InvitationsSection
				selectedId="00000000-0000-4000-8000-000000000100"
				invitations={[
					{
						id: "00000000-0000-4000-8000-000000000100",
						slug: "owner-invitation",
						themeSlug: "elegant-green",
						status: "payment_pending",
						createdAt: "2026-01-01T00:00:00Z",
					},
				]}
			/>,
		);
		expect(markup).toContain("Menunggu pembayaran");
		expect(markup).toContain(
			'href="/create/elegant-green?invitationId=00000000-0000-4000-8000-000000000100"',
		);
		expect(markup).toContain(
			'href="/create/review/00000000-0000-4000-8000-000000000100/preview"',
		);
		expect(markup).not.toContain("checkout");
	});
});
