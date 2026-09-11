"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DashboardGuest } from "../../../actions/dashboard/dashboard";
import {
	copyDashboardGuestLink,
	createDashboardGuest,
	deleteDashboardGuest,
	regenerateDashboardGuestLink,
	updateDashboardGuest,
} from "../../../actions/dashboard/guests";

export function GuestsSection({
	invitationId,
	guests,
}: {
	invitationId: string;
	guests: DashboardGuest[];
}) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function copyPath(path: string) {
		await navigator.clipboard.writeText(path);
		setMessage("Tautan personal tersalin.");
	}

	async function run(operation: () => Promise<unknown>) {
		setBusy(true);
		setMessage(null);
		try {
			await operation();
			router.refresh();
		} catch (error) {
			setMessage((error as Error).message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<section id="guests" aria-labelledby="guests-title">
			<h2 id="guests-title" className="font-serif text-2xl">
				Tamu
			</h2>
			<form
				className="mt-4 flex gap-3"
				onSubmit={(event) => {
					event.preventDefault();
					void run(async () => {
						const result = await createDashboardGuest(invitationId, name);
						setName("");
						await copyPath(result.path);
					});
				}}
			>
				<input
					aria-label="Nama tamu"
					required
					value={name}
					onChange={(event) => setName(event.target.value)}
					className="min-w-0 flex-1 rounded-md border border-border px-3 py-2"
				/>
				<button
					disabled={busy}
					type="submit"
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
				>
					Tambah
				</button>
			</form>
			{message && (
				<p role="status" className="mt-3 text-sm">
					{message}
				</p>
			)}
			<ul className="mt-4 space-y-3">
				{guests.map((guest) => (
					<li
						key={guest.id}
						className="rounded-lg border border-border bg-card p-4"
					>
						<p className="font-medium">{guest.name}</p>
						<div className="mt-3 flex flex-wrap gap-3 text-sm">
							<button
								disabled={busy}
								type="button"
								onClick={() =>
									void run(async () =>
										copyPath(
											await copyDashboardGuestLink(invitationId, guest.id),
										),
									)
								}
							>
								Salin tautan
							</button>
							<button
								disabled={busy}
								type="button"
								onClick={() =>
									void run(async () =>
										copyPath(
											await regenerateDashboardGuestLink(
												invitationId,
												guest.id,
											),
										),
									)
								}
							>
								Buat ulang tautan
							</button>
							<button
								disabled={busy}
								type="button"
								onClick={() => {
									const nextName = window.prompt("Nama tamu", guest.name);
									if (nextName !== null)
										void run(() =>
											updateDashboardGuest(invitationId, guest.id, nextName),
										);
								}}
							>
								Edit nama
							</button>
							<button
								disabled={busy}
								type="button"
								onClick={() =>
									void run(() => deleteDashboardGuest(invitationId, guest.id))
								}
							>
								Hapus
							</button>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
