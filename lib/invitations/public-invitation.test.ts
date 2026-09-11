import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ sign: vi.fn() }));
vi.mock("../storage/public-invitation-assets", () => ({
	signValidatedPublicInvitationAssets: mocks.sign,
}));

import { hashInviteeToken } from "../dashboard/invitee-token";
import { getPublicInvitation } from "./public-invitation";
import { PublicInvitationTestDatabase } from "./public-invitation-test-support";

const token = "A".repeat(43);
const now = new Date("2026-01-01T00:00:00.000Z");

describe("public invitation authorization", () => {
	let database: PublicInvitationTestDatabase;
	beforeEach(() => {
		database = new PublicInvitationTestDatabase(hashInviteeToken(token));
		mocks.sign.mockReset();
		mocks.sign.mockResolvedValue({});
	});
	const load = (slug = "owner-one", rawToken = token) =>
		getPublicInvitation(slug, rawToken, {
			now,
			createClient: (() => database.client) as never,
		});

	it("renders valid active invitation from persisted ordered data", async () => {
		const result = await load();
		expect(result?.invitee).toEqual({
			id: "invitee",
			name: "Tamu",
			status: "pending",
		});
		expect(result?.invitation).toMatchObject({
			id: "invitation-owner-one",
			slug: "owner-one",
			weddingDate: "2098-01-01T09:00",
		});
		expect(result?.invitation.events[0]).toMatchObject({
			id: "event-0",
			isMainEvent: true,
		});
		expect(result?.invitation.gallery[0]).toMatchObject({
			id: "gallery-0",
			type: "youtube",
			videoId: "abcdefghijk",
		});
		expect(result?.invitation.gifts[0].accountNumber).toBe("001");
		expect(result?.invitation.wishes[0]).toEqual({
			id: "wish-0",
			name: "Guest",
			message: "Selamat",
			createdAt: "2026-01-01",
		});
	});

	it("uses exact SHA-256 lookup and never selects ciphertext", async () => {
		await load();
		expect(database.selects[0]).toEqual({
			table: "invitation_guests",
			columns: "id,invitation_id,name",
		});
		expect(
			database.selects.some(({ columns }) =>
				columns.includes("guest_token_encrypted"),
			),
		).toBe(false);
	});

	it.each(["short", "A".repeat(42), `${"A".repeat(42)}!`])(
		"rejects malformed token %s before creating privileged client",
		async (rawToken) => {
			const createClient = vi.fn();
			await expect(
				getPublicInvitation("owner-one", rawToken, {
					now,
					createClient: createClient as never,
				}),
			).resolves.toBeNull();
			expect(createClient).not.toHaveBeenCalled();
		},
	);

	it("rejects unknown token and wrong slug without child loading or signing", async () => {
		await expect(load("owner-one", "B".repeat(43))).resolves.toBeNull();
		expect(database.selects.map(({ table }) => table)).toEqual([
			"invitation_guests",
		]);
		database.selects = [];
		await expect(load("wrong-slug")).resolves.toBeNull();
		expect(database.selects.map(({ table }) => table)).toEqual([
			"invitation_guests",
			"invitations",
		]);
		expect(mocks.sign).not.toHaveBeenCalled();
	});

	it.each(["draft", "payment_pending", "expired"])(
		"rejects %s lifecycle before children",
		async (status) => {
			database.tables.invitations[0].status = status;
			await expect(load()).resolves.toBeNull();
			expect(database.selects).toHaveLength(2);
			expect(mocks.sign).not.toHaveBeenCalled();
		},
	);

	it.each([
		null,
		"invalid",
		"2026-01-01T00:00:00.000Z",
		"2025-01-01T00:00:00.000Z",
	])(
		"rejects active invalid expiry %s regardless of delete_after",
		async (expiry) => {
			database.tables.invitations[0].expires_at = expiry;
			database.tables.invitations[0].delete_after = "2099-01-01T00:00:00.000Z";
			await expect(load()).resolves.toBeNull();
			expect(database.selects).toHaveLength(2);
		},
	);

	it("rejects unknown renderer before child loading and signing", async () => {
		database.tables.invitations[0].themes = { renderer_key: "unknown" };
		await expect(load()).resolves.toBeNull();
		expect(database.selects).toHaveLength(3);
		expect(mocks.sign).not.toHaveBeenCalled();
	});

	it("never reads RSVP, transaction, or mutation tables", async () => {
		await load();
		expect(database.selects.map(({ table }) => table)).not.toContain("rsvps");
		expect(database.selects.map(({ table }) => table)).not.toContain(
			"transactions",
		);
	});

	it("does not emit the raw token to application logs", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const error = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		await load();
		expect(log).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
		log.mockRestore();
		error.mockRestore();
	});
});
