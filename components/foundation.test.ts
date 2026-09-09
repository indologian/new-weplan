import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
	readFileSync(resolve(process.cwd(), path), "utf8");

describe("foundation", () => {
	it("defines every required semantic design token", () => {
		const tokens = projectFile("styles/tokens.css");
		const requiredTokens = [
			"primary",
			"primary-foreground",
			"secondary",
			"secondary-foreground",
			"background",
			"foreground",
			"card",
			"card-foreground",
			"muted",
			"muted-foreground",
			"border",
			"accent",
			"success",
			"warning",
			"destructive",
			"radius-sm",
			"radius-md",
			"radius-lg",
			"font-body",
			"font-heading",
		];

		for (const token of requiredTokens) {
			expect(tokens).toContain(`--${token}:`);
		}
	});

	it("keeps privileged Supabase credentials out of the browser client", () => {
		const browserClient = projectFile("lib/supabase/client.ts");
		const adminClient = projectFile("lib/supabase/admin.ts");

		expect(browserClient).not.toContain("SUPABASE_SECRET_KEY");
		expect(adminClient).toContain('import "server-only"');
		expect(adminClient).toContain("getSupabaseSecretKey");
	});
});
