import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashInviteeToken } from "../dashboard/invitee-token";
import { InviteeTestDatabase } from "./invitee-test-support";
import { getInviteeWishes, putInviteeWish } from "./wishes";

const token = "A".repeat(43);
const now = new Date("2026-01-01T00:00:00.000Z");

describe("invitee Wishes", () => {
	let database: InviteeTestDatabase;
	beforeEach(() => {
		database = new InviteeTestDatabase(hashInviteeToken(token));
	});
	const options = () => ({
		now,
		createClient: (() => database.client) as never,
	});

	it("creates then edits only the token-resolved guest Wish", async () => {
		await putInviteeWish(token, { message: "First" }, options());
		await putInviteeWish(token, { message: "Edited" }, options());
		expect(database.tables.wishes).toHaveLength(1);
		expect(database.tables.wishes[0]).toMatchObject({
			invitation_id: "00000000-0000-4000-8000-000000000100",
			guest_id: "00000000-0000-4000-8000-000000000200",
			message: "Edited",
		});
		expect(
			database.upserts.every(({ onConflict }) => onConflict === "guest_id"),
		).toBe(true);
	});

	it("keeps concurrent duplicate submissions to one Wish", async () => {
		await Promise.all([
			putInviteeWish(token, { message: "One" }, options()),
			putInviteeWish(token, { message: "Two" }, options()),
		]);
		expect(database.tables.wishes).toHaveLength(1);
	});

	it("cannot edit another guest's Wish", async () => {
		database.tables.wishes.push({
			id: "other-wish",
			invitation_id: "00000000-0000-4000-8000-000000000100",
			guest_id: "00000000-0000-4000-8000-000000000201",
			message: "Other original",
			created_at: "2026-01-01T00:00:00.000Z",
		});
		await putInviteeWish(token, { message: "Mine" }, options());
		expect(database.tables.wishes).toHaveLength(2);
		expect(database.tables.wishes[0].message).toBe("Other original");
	});

	it("returns deterministic safe fields and computes isMine", async () => {
		database.tables.wishes.push(
			{
				id: "b",
				invitation_id: "00000000-0000-4000-8000-000000000100",
				guest_id: "other",
				message: "<b>plain</b>",
				created_at: "2026-02-01T00:00:00.000Z",
				invitation_guests: { name: "Other" },
			},
			{
				id: "a",
				invitation_id: "00000000-0000-4000-8000-000000000100",
				guest_id: "00000000-0000-4000-8000-000000000200",
				message: "Mine",
				created_at: "2026-02-01T00:00:00.000Z",
				invitation_guests: { name: "Tamu A" },
			},
			{
				id: "foreign",
				invitation_id: "00000000-0000-4000-8000-000000000999",
				guest_id: "foreign",
				message: "Must not leak",
				created_at: "2099-01-01T00:00:00.000Z",
				invitation_guests: { name: "Foreign" },
			},
		);
		const result = await getInviteeWishes(token, options());
		expect(result.wishes).toEqual([
			{
				name: "Tamu A",
				message: "Mine",
				createdAt: "2026-02-01T00:00:00.000Z",
				isMine: true,
			},
			{
				name: "Other",
				message: "<b>plain</b>",
				createdAt: "2026-02-01T00:00:00.000Z",
				isMine: false,
			},
		]);
		expect(JSON.stringify(result)).not.toContain("guest_id");
		expect(JSON.stringify(result)).not.toContain("invitation_id");
		expect(JSON.stringify(result)).not.toContain("Must not leak");
	});

	it("fails closed when Wishes are disabled", async () => {
		database.tables.invitations[0].wishes_enabled = false;
		await expect(getInviteeWishes(token, options())).rejects.toMatchObject({
			kind: "not_found",
		});
		expect(database.upserts).toHaveLength(0);
	});
});
