"use client";

import { useEffect, useState } from "react";
import {
	createGiftAccount,
	deleteGiftAccount,
	getGiftAccounts,
	reorderGiftAccounts,
	updateGiftAccount,
} from "@/actions/invitations/gifts";
import type {
	GiftAccount,
	GiftAccountContentInput,
} from "@/validations/gift-account";
import { copyGiftAccountNumber } from "../utils/gift-account-copy";

const emptyAccount: GiftAccountContentInput = {
	bankName: "",
	accountNumber: "",
	accountHolder: "",
};

export function GiftsForm({ invitationId }: { invitationId: string }) {
	const [accounts, setAccounts] = useState<GiftAccount[]>([]);
	const [draft, setDraft] = useState<GiftAccountContentInput>(emptyAccount);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reload = async () => setAccounts(await getGiftAccounts(invitationId));

	useEffect(() => {
		getGiftAccounts(invitationId)
			.then(setAccounts)
			.catch((loadError: Error) => setError(loadError.message));
	}, [invitationId]);

	const resetDraft = () => {
		setDraft(emptyAccount);
		setEditingId(null);
	};

	const submitAccount = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsBusy(true);
		setError(null);
		try {
			if (editingId) {
				await updateGiftAccount(invitationId, editingId, draft);
			} else {
				await createGiftAccount(invitationId, draft);
			}
			resetDraft();
			await reload();
		} catch (submitError) {
			setError((submitError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const moveAccount = async (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= accounts.length) return;
		const reordered = [...accounts];
		[reordered[index], reordered[target]] = [
			reordered[target],
			reordered[index],
		];
		setIsBusy(true);
		setError(null);
		try {
			await reorderGiftAccounts(
				invitationId,
				reordered.map(({ id }) => id),
			);
			await reload();
		} catch (reorderError) {
			setError((reorderError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<section
			id="gifts-step"
			className="space-y-6"
			aria-labelledby="gifts-title"
		>
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 id="gifts-title" className="mb-4 text-xl font-bold">
					Hadiah Pernikahan
				</h2>
				{accounts.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Belum ada rekening hadiah.
					</p>
				) : (
					<ol className="space-y-3">
						{accounts.map((account, index) => (
							<li
								key={account.id}
								className="rounded-md border border-border p-4"
							>
								<h3 className="font-semibold">{account.bankName}</h3>
								<p className="font-mono text-base">{account.accountNumber}</p>
								<p className="text-sm text-muted-foreground">
									atas nama {account.accountHolder}
								</p>
								<div className="mt-3 flex flex-wrap gap-3">
									<button
										type="button"
										disabled={isBusy}
										onClick={async () => {
											setError(null);
											try {
												await copyGiftAccountNumber(account.accountNumber);
												setCopiedId(account.id);
											} catch {
												setError("Nomor rekening gagal disalin.");
											}
										}}
									>
										{copiedId === account.id ? "Tersalin" : "Salin nomor"}
									</button>
									<button
										type="button"
										disabled={isBusy || index === 0}
										onClick={() => moveAccount(index, -1)}
									>
										Naik
									</button>
									<button
										type="button"
										disabled={isBusy || index === accounts.length - 1}
										onClick={() => moveAccount(index, 1)}
									>
										Turun
									</button>
									<button
										type="button"
										disabled={isBusy}
										onClick={() => {
											setEditingId(account.id);
											setDraft({
												bankName: account.bankName,
												accountNumber: account.accountNumber,
												accountHolder: account.accountHolder,
											});
										}}
									>
										Edit
									</button>
									<button
										type="button"
										disabled={isBusy}
										onClick={async () => {
											setIsBusy(true);
											setError(null);
											try {
												await deleteGiftAccount(invitationId, account.id);
												if (editingId === account.id) resetDraft();
												await reload();
											} catch (deleteError) {
												setError((deleteError as Error).message);
											} finally {
												setIsBusy(false);
											}
										}}
									>
										Hapus
									</button>
								</div>
							</li>
						))}
					</ol>
				)}
			</div>

			<form
				onSubmit={submitAccount}
				className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
			>
				<h3 className="text-lg font-bold">
					{editingId ? "Edit rekening" : "Tambah rekening"}
				</h3>
				<label className="block text-sm font-medium">
					Nama bank
					<input
						required
						className="mt-1 w-full rounded-md border border-border px-3 py-2"
						value={draft.bankName}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								bankName: event.target.value,
							}))
						}
					/>
				</label>
				<label className="block text-sm font-medium">
					Nomor rekening
					<input
						required
						type="text"
						className="mt-1 w-full rounded-md border border-border px-3 py-2 font-mono"
						value={draft.accountNumber}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								accountNumber: event.target.value,
							}))
						}
					/>
				</label>
				<label className="block text-sm font-medium">
					Nama pemilik rekening
					<input
						required
						className="mt-1 w-full rounded-md border border-border px-3 py-2"
						value={draft.accountHolder}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								accountHolder: event.target.value,
							}))
						}
					/>
				</label>
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
				<div className="flex gap-3">
					<button
						type="submit"
						disabled={isBusy}
						className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
					>
						{isBusy
							? "Menyimpan..."
							: editingId
								? "Simpan perubahan"
								: "Tambah rekening"}
					</button>
					{editingId && (
						<button type="button" disabled={isBusy} onClick={resetDraft}>
							Batal
						</button>
					)}
				</div>
			</form>
		</section>
	);
}
