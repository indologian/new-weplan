import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import { GiftTestDatabase } from "./gift-test-support";
import {
	createGiftAccount,
	deleteGiftAccount,
	getGiftAccounts,
	reorderGiftAccounts,
	updateGiftAccount,
} from "./gifts";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

const content = (accountNumber = "001234567890") => ({
	bankName: "Bank Contoh",
	accountNumber,
	accountHolder: "Budi",
});

describe("gift account actions", () => {
	let database: GiftTestDatabase;

	beforeEach(() => {
		database = new GiftTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("rejects unauthenticated access", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValueOnce(
			new Error("Silakan masuk"),
		);
		await expect(createGiftAccount(invitationId, content())).rejects.toThrow(
			"Silakan masuk",
		);
	});

	it("creates multiple accounts and preserves account numbers as strings", async () => {
		await createGiftAccount(invitationId, content("001234567890"));
		await createGiftAccount(invitationId, content("000000000002"));
		const accounts = await getGiftAccounts(invitationId);
		expect(accounts.map(({ accountNumber }) => accountNumber)).toEqual([
			"001234567890",
			"000000000002",
		]);
		expect(accounts.map(({ sortOrder }) => sortOrder)).toEqual([0, 1]);
		expect(database.accounts[0].account_number).toBe("001234567890");
	});

	it("trims surrounding whitespace without removing leading zeroes", async () => {
		const account = await createGiftAccount(invitationId, {
			bankName: "  Bank Contoh ",
			accountNumber: "  001234567890  ",
			accountHolder: " Budi ",
		});
		expect(account).toMatchObject({
			bankName: "Bank Contoh",
			accountNumber: "001234567890",
			accountHolder: "Budi",
		});
	});

	it("updates and deletes an owned account", async () => {
		const account = await createGiftAccount(invitationId, content());
		const updated = await updateGiftAccount(
			invitationId,
			account.id,
			content("000009876543"),
		);
		expect(updated.accountNumber).toBe("000009876543");
		await deleteGiftAccount(invitationId, account.id);
		expect(await getGiftAccounts(invitationId)).toEqual([]);
	});

	it("rejects a cross-owner invitation", async () => {
		await expect(
			createGiftAccount(otherInvitationId, content()),
		).rejects.toThrow("Tidak memiliki akses");
	});

	it("rejects account IDs from another invitation for update and delete", async () => {
		mocks.requireAuthenticatedMutation.mockResolvedValueOnce({
			supabase: database.client,
			userId: otherOwnerId,
		});
		const foreign = await createGiftAccount(otherInvitationId, content());
		await expect(
			updateGiftAccount(invitationId, foreign.id, content()),
		).rejects.toThrow("tidak ditemukan");
		await expect(deleteGiftAccount(invitationId, foreign.id)).rejects.toThrow(
			"tidak ditemukan",
		);
	});

	it("reorders the complete account set into deterministic 0..n-1", async () => {
		const first = await createGiftAccount(invitationId, content("001"));
		const second = await createGiftAccount(invitationId, content("002"));
		await reorderGiftAccounts(invitationId, [second.id, first.id]);
		expect(
			(await getGiftAccounts(invitationId)).map(({ id, sortOrder }) => ({
				id,
				sortOrder,
			})),
		).toEqual([
			{ id: second.id, sortOrder: 0 },
			{ id: first.id, sortOrder: 1 },
		]);
	});

	it("rejects duplicate, missing, stale, and foreign reorder IDs", async () => {
		const first = await createGiftAccount(invitationId, content("001"));
		const second = await createGiftAccount(invitationId, content("002"));
		mocks.requireAuthenticatedMutation.mockResolvedValueOnce({
			supabase: database.client,
			userId: otherOwnerId,
		});
		const foreign = await createGiftAccount(otherInvitationId, content("003"));
		await expect(
			reorderGiftAccounts(invitationId, [first.id, first.id]),
		).rejects.toThrow("Urutan rekening tidak valid");
		await expect(reorderGiftAccounts(invitationId, [first.id])).rejects.toThrow(
			"Muat ulang",
		);
		await expect(
			reorderGiftAccounts(invitationId, [first.id, foreign.id]),
		).rejects.toThrow("Muat ulang");
		expect(second.id).toBeTruthy();
	});
});
