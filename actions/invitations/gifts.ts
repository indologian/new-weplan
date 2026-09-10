"use server";

import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import {
	type GiftAccount,
	type GiftAccountContentInput,
	giftAccountContentSchema,
	giftAccountIdSchema,
	giftInvitationIdSchema,
	reorderGiftAccountsSchema,
} from "../../validations/gift-account";

type AuthenticatedSupabase = Awaited<
	ReturnType<typeof requireAuthenticatedMutation>
>["supabase"];

const giftAccountColumns =
	"id,bank_name,account_number,account_holder,sort_order";

async function requireOwnedInvitation(
	supabase: AuthenticatedSupabase,
	userId: string,
	invitationId: string,
) {
	const parsed = giftInvitationIdSchema.safeParse(invitationId);
	if (!parsed.success) throw new Error("Undangan tidak valid.");
	const { data, error } = await supabase
		.from("invitations")
		.select("id")
		.eq("id", parsed.data)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !data) throw new Error("Tidak memiliki akses ke undangan ini.");
	return parsed.data;
}

async function requireAccountInInvitation(
	supabase: AuthenticatedSupabase,
	invitationId: string,
	accountId: string,
) {
	const parsed = giftAccountIdSchema.safeParse(accountId);
	if (!parsed.success) throw new Error("Rekening tidak valid.");
	const { data, error } = await supabase
		.from("gift_accounts")
		.select("id")
		.eq("id", parsed.data)
		.eq("invitation_id", invitationId)
		.maybeSingle();
	if (error || !data) {
		throw new Error("Rekening tidak ditemukan pada undangan ini.");
	}
	return parsed.data;
}

function parseContent(input: GiftAccountContentInput) {
	const parsed = giftAccountContentSchema.safeParse(input);
	if (!parsed.success) throw new Error("Data rekening tidak valid.");
	return parsed.data;
}

function toPersistenceAccount(account: GiftAccountContentInput) {
	return {
		bank_name: account.bankName,
		account_number: account.accountNumber,
		account_holder: account.accountHolder,
	};
}

function fromPersistenceAccount(row: Record<string, unknown>): GiftAccount {
	return {
		id: String(row.id),
		bankName: String(row.bank_name),
		accountNumber: String(row.account_number),
		accountHolder: String(row.account_holder),
		sortOrder: Number(row.sort_order),
	};
}

export async function getGiftAccounts(
	invitationId: string,
): Promise<GiftAccount[]> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const { data, error } = await supabase
		.from("gift_accounts")
		.select(giftAccountColumns)
		.eq("invitation_id", ownedInvitationId)
		.order("sort_order", { ascending: true })
		.range(0, 9999);
	if (error) throw new Error("Gagal memuat rekening hadiah.");
	return (data ?? []).map((row) => fromPersistenceAccount(row));
}

export async function createGiftAccount(
	invitationId: string,
	input: GiftAccountContentInput,
): Promise<GiftAccount> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const account = parseContent(input);
	const { data: lastAccount, error: orderError } = await supabase
		.from("gift_accounts")
		.select("sort_order")
		.eq("invitation_id", ownedInvitationId)
		.order("sort_order", { ascending: false })
		.limit(1)
		.maybeSingle();
	if (orderError) throw new Error("Gagal menentukan urutan rekening.");

	const { data, error } = await supabase
		.from("gift_accounts")
		.insert({
			invitation_id: ownedInvitationId,
			...toPersistenceAccount(account),
			sort_order: lastAccount ? Number(lastAccount.sort_order) + 1 : 0,
		})
		.select(giftAccountColumns)
		.single();
	if (error || !data) throw new Error("Gagal membuat rekening hadiah.");
	return fromPersistenceAccount(data);
}

export async function updateGiftAccount(
	invitationId: string,
	accountId: string,
	input: GiftAccountContentInput,
): Promise<GiftAccount> {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedAccountId = await requireAccountInInvitation(
		supabase,
		ownedInvitationId,
		accountId,
	);
	const account = parseContent(input);
	const { data, error } = await supabase
		.from("gift_accounts")
		.update(toPersistenceAccount(account))
		.eq("id", ownedAccountId)
		.eq("invitation_id", ownedInvitationId)
		.select(giftAccountColumns)
		.single();
	if (error || !data) throw new Error("Gagal memperbarui rekening hadiah.");
	return fromPersistenceAccount(data);
}

export async function deleteGiftAccount(
	invitationId: string,
	accountId: string,
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const ownedAccountId = await requireAccountInInvitation(
		supabase,
		ownedInvitationId,
		accountId,
	);
	const { error } = await supabase
		.from("gift_accounts")
		.delete()
		.eq("id", ownedAccountId)
		.eq("invitation_id", ownedInvitationId)
		.select("id")
		.maybeSingle();
	if (error) throw new Error("Gagal menghapus rekening hadiah.");
}

export async function reorderGiftAccounts(
	invitationId: string,
	accountIds: string[],
) {
	const { supabase, userId } = await requireAuthenticatedMutation();
	const ownedInvitationId = await requireOwnedInvitation(
		supabase,
		userId,
		invitationId,
	);
	const parsedIds = reorderGiftAccountsSchema.safeParse(accountIds);
	if (!parsedIds.success) throw new Error("Urutan rekening tidak valid.");

	const { data: existingAccounts, error: lookupError } = await supabase
		.from("gift_accounts")
		.select("id")
		.eq("invitation_id", ownedInvitationId)
		.order("id", { ascending: true })
		.range(0, 9999);
	if (lookupError) throw new Error("Gagal memeriksa rekening hadiah.");

	const existingIds = new Set((existingAccounts ?? []).map(({ id }) => id));
	if (
		existingIds.size !== parsedIds.data.length ||
		parsedIds.data.some((accountId) => !existingIds.has(accountId))
	) {
		throw new Error(
			"Daftar rekening sudah berubah. Muat ulang sebelum mengurutkan kembali.",
		);
	}

	for (const [sortOrder, accountId] of parsedIds.data.entries()) {
		const { error } = await supabase
			.from("gift_accounts")
			.update({ sort_order: sortOrder })
			.eq("id", accountId)
			.eq("invitation_id", ownedInvitationId)
			.select("id")
			.maybeSingle();
		if (error) throw new Error("Gagal menyimpan urutan rekening hadiah.");
	}
}
