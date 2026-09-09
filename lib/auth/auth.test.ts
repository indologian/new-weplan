import { describe, expect, it } from "vitest";
import { canAccessAdmin, claimsSubject, dashboardPathForRole } from "./access";
import { loginSchema, registerSchema } from "./schemas";

describe("authentication boundaries", () => {
	it("rejects invalid credentials before calling Supabase", () => {
		expect(
			loginSchema.safeParse({ email: "invalid", password: "123" }).success,
		).toBe(false);
	});

	it("accepts valid registration input and trims the profile name", () => {
		const result = registerSchema.parse({
			fullName: "  Budi dan Ani  ",
			email: "couple@example.com",
			password: "secret123",
		});

		expect(result.fullName).toBe("Budi dan Ani");
	});

	it("rejects an unauthenticated claims payload", () => {
		expect(claimsSubject(null)).toBeNull();
		expect(claimsSubject({ role: "authenticated" })).toBeNull();
	});

	it("accepts only a non-empty verified claims subject", () => {
		expect(claimsSubject({ sub: "user-id" })).toBe("user-id");
		expect(claimsSubject({ sub: "" })).toBeNull();
	});

	it("does not allow a couple profile into the admin area", () => {
		expect(
			canAccessAdmin({ id: "couple-id", fullName: "Couple", role: "couple" }),
		).toBe(false);
	});

	it("routes each trusted database role to its own dashboard", () => {
		expect(dashboardPathForRole("couple")).toBe("/dashboard/couple");
		expect(dashboardPathForRole("admin")).toBe("/dashboard/admin");
	});
});
