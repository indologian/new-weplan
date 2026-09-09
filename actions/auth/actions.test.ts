import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	ensureCoupleProfile: vi.fn(),
	headers: vi.fn(),
	redirect: vi.fn((destination: string) => {
		throw new Error(`redirect:${destination}`);
	}),
	requireAuthenticatedMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("../../lib/supabase/server", () => ({
	createClient: mocks.createClient,
}));
vi.mock("../../lib/auth/profile", () => ({
	ensureCoupleProfile: mocks.ensureCoupleProfile,
}));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	googleOAuthAction,
	loginAction,
	logoutAction,
	registerAction,
} from "./actions";

function credentialsForm(overrides: Record<string, string> = {}) {
	const form = new FormData();
	form.set("email", overrides.email ?? "couple@example.com");
	form.set("password", overrides.password ?? "secret123");
	if (overrides.fullName !== undefined) {
		form.set("fullName", overrides.fullName);
	}
	return form;
}

describe("authentication server actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rejects malformed login input before creating a Supabase client", async () => {
		const result = await loginAction(
			{},
			credentialsForm({ email: "invalid", password: "123" }),
		);

		expect(result.error).toBeDefined();
		expect(mocks.createClient).not.toHaveBeenCalled();
	});

	it("signs in valid credentials and redirects to the protected dashboard", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
		mocks.createClient.mockResolvedValue({ auth: { signInWithPassword } });

		await expect(loginAction({}, credentialsForm())).rejects.toThrow(
			"redirect:/dashboard",
		);
		expect(signInWithPassword).toHaveBeenCalledWith({
			email: "couple@example.com",
			password: "secret123",
		});
	});

	it("provisions a fixed couple profile after registration", async () => {
		const user = { id: "new-user", identities: [{ id: "identity" }] };
		const signUp = vi.fn().mockResolvedValue({
			data: { session: null, user },
			error: null,
		});
		mocks.createClient.mockResolvedValue({ auth: { signUp } });

		const result = await registerAction(
			{},
			credentialsForm({ fullName: "Budi dan Ani" }),
		);

		expect(mocks.ensureCoupleProfile).toHaveBeenCalledWith(
			user,
			"Budi dan Ani",
		);
		expect(result.message).toContain("konfirmasi");
	});

	it("builds the Google OAuth callback from the request origin", async () => {
		const signInWithOAuth = vi.fn().mockResolvedValue({
			data: { url: "https://accounts.google.test/oauth" },
			error: null,
		});
		mocks.headers.mockResolvedValue(
			new Headers({ origin: "https://weplan.test" }),
		);
		mocks.createClient.mockResolvedValue({ auth: { signInWithOAuth } });

		await expect(googleOAuthAction()).rejects.toThrow(
			"redirect:https://accounts.google.test/oauth",
		);
		expect(signInWithOAuth).toHaveBeenCalledWith({
			provider: "google",
			options: { redirectTo: "https://weplan.test/auth/callback" },
		});
	});

	it("rejects logout before mutation when no verified identity exists", async () => {
		const signOut = vi.fn();
		mocks.requireAuthenticatedMutation.mockRejectedValue(
			new Error("unauthenticated"),
		);

		await expect(logoutAction()).rejects.toThrow("unauthenticated");
		expect(signOut).not.toHaveBeenCalled();
	});

	it("logs out only after the authenticated mutation guard succeeds", async () => {
		const signOut = vi.fn().mockResolvedValue({ error: null });
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: { auth: { signOut } },
			userId: "verified-user",
		});

		await expect(logoutAction()).rejects.toThrow("redirect:/login");
		expect(signOut).toHaveBeenCalledOnce();
	});
});
