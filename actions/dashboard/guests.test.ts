import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ requireCoupleDashboardContext: vi.fn() }));
vi.mock("../../lib/dashboard/authorization", () => ({
	requireCoupleDashboardContext: mocks.requireCoupleDashboardContext,
}));

import {
	encryptInviteeToken,
	hashInviteeToken,
} from "../../lib/dashboard/invitee-token";
import { DashboardTestDatabase } from "./dashboard-test-support";
import {
	copyDashboardGuestLink,
	createDashboardGuest,
	deleteDashboardGuest,
	regenerateDashboardGuestLink,
	updateDashboardGuest,
} from "./guests";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";
const guestId = "00000000-0000-4000-8000-000000000301";
const oldKey = process.env.INVITEE_TOKEN_ENCRYPTION_KEY;

describe("dashboard guest actions", () => {
	let database: DashboardTestDatabase;
	beforeEach(() => {
		process.env.INVITEE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString(
			"base64",
		);
		database = new DashboardTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		database.tables.invitation_guests[0].guest_token_encrypted =
			encryptInviteeToken("stable-token");
		mocks.requireCoupleDashboardContext.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
			profile: { id: ownerId, fullName: "Owner", role: "couple" },
		});
	});
	afterEach(() => {
		if (oldKey === undefined) delete process.env.INVITEE_TOKEN_ENCRYPTION_KEY;
		else process.env.INVITEE_TOKEN_ENCRYPTION_KEY = oldKey;
	});
	it("rejects unauthenticated and foreign invitations", async () => {
		mocks.requireCoupleDashboardContext.mockRejectedValueOnce(
			new Error("Login"),
		);
		await expect(createDashboardGuest(invitationId, "Tamu")).rejects.toThrow(
			"Login",
		);
		await expect(
			createDashboardGuest(otherInvitationId, "Tamu"),
		).rejects.toThrow("tidak dapat diakses");
	});
	it("creates duplicate names without persisting the raw token", async () => {
		const first = await createDashboardGuest(invitationId, "Nama Sama");
		const second = await createDashboardGuest(invitationId, "Nama Sama");
		expect(first.path).toMatch(/^\/invitation\/owner-one\/[A-Za-z0-9_-]+$/);
		expect(second.path).not.toBe(first.path);
		const persisted = database.tables.invitation_guests.slice(-2);
		expect(persisted.every((row) => row.name === "Nama Sama")).toBe(true);
		expect(persisted.every((row) => !("token" in row))).toBe(true);
		expect(
			persisted.every(
				(row) => !first.path.includes(String(row.guest_token_hash)),
			),
		).toBe(true);
	});
	it("retries only a proven token-hash collision", async () => {
		database.insertErrors.push({
			code: "23505",
			message: "duplicate key invitation_guests_guest_token_hash_key",
		});
		await expect(
			createDashboardGuest(invitationId, "Tamu"),
		).resolves.toBeTruthy();
		expect(
			database.mutationTables.filter((table) => table === "invitation_guests"),
		).toHaveLength(2);
		database.insertErrors.push({ code: "42501", message: "denied" });
		await expect(createDashboardGuest(invitationId, "Tamu")).rejects.toThrow(
			"tidak dapat ditambahkan",
		);
	});
	it("copies repeatedly without mutation or trusting client slug/origin", async () => {
		const before = database.mutationTables.length;
		await expect(copyDashboardGuestLink(invitationId, guestId)).resolves.toBe(
			"/invitation/owner-one/stable-token",
		);
		await expect(copyDashboardGuestLink(invitationId, guestId)).resolves.toBe(
			"/invitation/owner-one/stable-token",
		);
		expect(database.mutationTables).toHaveLength(before);
	});
	it("regenerates hash and ciphertext in one row update", async () => {
		const oldHash = database.tables.invitation_guests[0].guest_token_hash;
		const path = await regenerateDashboardGuestLink(invitationId, guestId);
		expect(path).toMatch(/^\/invitation\/owner-one\//);
		expect(database.updatePayloads).toHaveLength(1);
		expect(Object.keys(database.updatePayloads[0]).sort()).toEqual([
			"guest_token_encrypted",
			"guest_token_hash",
		]);
		expect(database.tables.invitation_guests[0].guest_token_hash).not.toBe(
			oldHash,
		);
		expect(hashInviteeToken("stable-token")).not.toBe(
			database.tables.invitation_guests[0].guest_token_hash,
		);
	});
	it("keeps old token material authoritative when regenerate fails", async () => {
		const before = { ...database.tables.invitation_guests[0] };
		database.updateErrors.push({ code: "42501", message: "denied" });
		await expect(
			regenerateDashboardGuestLink(invitationId, guestId),
		).rejects.toThrow("tidak dapat diperbarui");
		expect(database.tables.invitation_guests[0]).toEqual(before);
	});
	it("updates and deletes only guest.id plus invitation_id", async () => {
		await expect(
			updateDashboardGuest(invitationId, guestId, " Nama Baru "),
		).resolves.toMatchObject({ name: "Nama Baru" });
		await deleteDashboardGuest(invitationId, guestId);
		expect(
			database.tables.invitation_guests.some((row) => row.id === guestId),
		).toBe(false);
	});
	it("rejects a foreign invitation child UUID", async () => {
		const foreignGuest = "00000000-0000-4000-8000-000000000399";
		await expect(
			copyDashboardGuestLink(invitationId, foreignGuest),
		).rejects.toThrow("Data tamu tidak dapat diakses");
		await expect(
			deleteDashboardGuest(invitationId, foreignGuest),
		).rejects.toThrow("Data tamu tidak dapat diakses");
	});
});
