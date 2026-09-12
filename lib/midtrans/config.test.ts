import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getMidtransConfig } from "./config";

describe("Midtrans config", () => {
	it("selects sandbox by default", () => {
		const value = getMidtransConfig({
			MIDTRANS_SERVER_KEY: "server",
			NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "client",
			MIDTRANS_IS_PRODUCTION: "false",
		});
		expect(value.snapUrl).toContain("sandbox");
		expect(value.statusUrl).toContain("sandbox");
	});
	it("selects production explicitly", () => {
		const value = getMidtransConfig({
			MIDTRANS_SERVER_KEY: "server",
			NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "client",
			MIDTRANS_IS_PRODUCTION: "true",
		});
		expect(value.snapUrl).not.toContain("sandbox");
	});
	it("fails closed when a key is missing", () => {
		expect(() => getMidtransConfig({})).toThrow();
	});
});
