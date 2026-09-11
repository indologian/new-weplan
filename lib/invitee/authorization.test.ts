import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashInviteeToken } from "../dashboard/invitee-token";
import { authorizeInviteeToken } from "./authorization";
import { InviteeTestDatabase } from "./invitee-test-support";

const token = "A".repeat(43);
const now = new Date("2026-01-01T00:00:00.000Z");

describe("shared invitee authorization", () => {
	let database: InviteeTestDatabase;
	beforeEach(() => {
		database = new InviteeTestDatabase(hashInviteeToken(token));
	});
	const authorize = (rawToken: unknown = token) =>
		authorizeInviteeToken(rawToken, {
			now,
			createClient: (() => database.client) as never,
		});

	it("returns only trusted context after hash lookup", async () => {
		await expect(authorize()).resolves.toMatchObject({
			guestId: "00000000-0000-4000-8000-000000000200",
			guestName: "Tamu A",
			invitationId: "00000000-0000-4000-8000-000000000100",
			invitationSlug: "owner-one",
			rsvpEnabled: true,
			wishesEnabled: true,
		});
		expect(database.selects).toEqual([
			{
				table: "invitation_guests",
				columns: "id,invitation_id,name",
			},
			{
				table: "invitations",
				columns: "id,slug,status,expires_at,rsvp_enabled,wishes_enabled",
			},
		]);
		expect(JSON.stringify(database.selects)).not.toContain("encrypted");
	});

	it("rejects malformed and unknown tokens", async () => {
		const createClient = vi.fn();
		await expect(
			authorizeInviteeToken("bad", { createClient: createClient as never }),
		).resolves.toBeNull();
		expect(createClient).not.toHaveBeenCalled();
		await expect(authorize("B".repeat(43))).resolves.toBeNull();
	});

	it.each([
		["draft", "2099-01-01T00:00:00.000Z"],
		["payment_pending", "2099-01-01T00:00:00.000Z"],
		["expired", "2099-01-01T00:00:00.000Z"],
		["active", null],
		["active", "2026-01-01T00:00:00.000Z"],
		["active", "2025-01-01T00:00:00.000Z"],
	])("rejects lifecycle %s / %s", async (status, expiresAt) => {
		database.tables.invitations[0].status = status;
		database.tables.invitations[0].expires_at = expiresAt;
		await expect(authorize()).resolves.toBeNull();
	});

	it("allows active future expiry and ignores delete_after", async () => {
		database.tables.invitations[0].delete_after = "2025-01-01T00:00:00.000Z";
		await expect(authorize()).resolves.not.toBeNull();
	});

	it("does not log raw token or hash", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const error = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		await authorize();
		expect(log).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
		log.mockRestore();
		error.mockRestore();
	});
});
