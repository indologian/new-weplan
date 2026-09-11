import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashInviteeToken } from "../dashboard/invitee-token";
import type { InviteeInteractionError } from "./errors";
import { InviteeTestDatabase } from "./invitee-test-support";
import { getInviteeRsvp, putInviteeRsvp } from "./rsvp";

const token = "A".repeat(43);
const now = new Date("2026-01-01T00:00:00.000Z");

describe("invitee RSVP", () => {
	let database: InviteeTestDatabase;
	beforeEach(() => {
		database = new InviteeTestDatabase(hashInviteeToken(token));
	});
	const options = () => ({
		now,
		createClient: (() => database.client) as never,
	});

	it("returns a safe unanswered state", async () => {
		await expect(getInviteeRsvp(token, options())).resolves.toEqual({
			attendance: null,
			guestCount: 0,
			responded: false,
		});
	});

	it("atomically creates then edits one RSVP for the trusted pair", async () => {
		await putInviteeRsvp(
			token,
			{ attendance: "attending", guestCount: 2 },
			options(),
		);
		await putInviteeRsvp(
			token,
			{ attendance: "not_attending", guestCount: 0 },
			options(),
		);
		expect(database.tables.rsvps).toHaveLength(1);
		expect(database.tables.rsvps[0]).toMatchObject({
			invitation_id: "00000000-0000-4000-8000-000000000100",
			guest_id: "00000000-0000-4000-8000-000000000200",
			attendance: "not_attending",
			guest_count: 0,
		});
		expect(database.upserts).toHaveLength(2);
		expect(
			database.upserts.every(({ onConflict }) => onConflict === "guest_id"),
		).toBe(true);
	});

	it("keeps concurrent duplicate submissions on the unique guest target", async () => {
		await Promise.all([
			putInviteeRsvp(
				token,
				{ attendance: "attending", guestCount: 1 },
				options(),
			),
			putInviteeRsvp(
				token,
				{ attendance: "attending", guestCount: 3 },
				options(),
			),
		]);
		expect(database.tables.rsvps).toHaveLength(1);
	});

	it("does not read or overwrite a foreign invitation RSVP", async () => {
		database.tables.rsvps.push({
			id: "foreign-rsvp",
			invitation_id: "00000000-0000-4000-8000-000000000999",
			guest_id: "00000000-0000-4000-8000-000000000999",
			attendance: "attending",
			guest_count: 99,
		});
		await expect(getInviteeRsvp(token, options())).resolves.toMatchObject({
			responded: false,
		});
		await putInviteeRsvp(
			token,
			{ attendance: "attending", guestCount: 1 },
			options(),
		);
		expect(database.tables.rsvps).toHaveLength(2);
		expect(database.tables.rsvps[0].guest_count).toBe(99);
	});

	it("fails closed when RSVP is disabled", async () => {
		database.tables.invitations[0].rsvp_enabled = false;
		await expect(getInviteeRsvp(token, options())).rejects.toMatchObject({
			kind: "not_found",
		} satisfies Partial<InviteeInteractionError>);
		expect(database.upserts).toHaveLength(0);
	});
});
