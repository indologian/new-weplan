"use client";

import { useEffect, useState } from "react";
import {
	getInteractionConfig,
	updateInteractionConfig,
} from "@/actions/invitations/interaction-config";
import type { InteractionConfig } from "@/validations/interaction-config";

export function InteractionConfigForm({
	invitationId,
}: {
	invitationId: string;
}) {
	const [config, setConfig] = useState<InteractionConfig | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		setConfig(null);
		setError(null);
		getInteractionConfig(invitationId)
			.then(setConfig)
			.catch((loadError: Error) => setError(loadError.message));
	}, [invitationId]);

	if (!config) {
		return (
			<section
				id="interaction-config-step"
				className="rounded-lg border border-border bg-card p-6 shadow-sm"
				aria-labelledby="interaction-config-title"
			>
				<h2 id="interaction-config-title" className="text-xl font-bold">
					Interaksi Tamu
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					{error ?? "Memuat pengaturan tersimpan..."}
				</p>
			</section>
		);
	}

	return (
		<section
			id="interaction-config-step"
			className="rounded-lg border border-border bg-card p-6 shadow-sm"
			aria-labelledby="interaction-config-title"
		>
			<h2 id="interaction-config-title" className="text-xl font-bold">
				Interaksi Tamu
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				Atur RSVP dan ucapan secara independen.
			</p>

			<form
				className="mt-5 space-y-4"
				onSubmit={async (event) => {
					event.preventDefault();
					setIsSaving(true);
					setError(null);
					setMessage(null);
					try {
						const persisted = await updateInteractionConfig(
							invitationId,
							config,
						);
						setConfig(persisted);
						setMessage("Pengaturan interaksi tersimpan.");
					} catch (saveError) {
						setError((saveError as Error).message);
					} finally {
						setIsSaving(false);
					}
				}}
			>
				<label className="flex items-start gap-3 rounded-md border border-border p-4">
					<input
						type="checkbox"
						checked={config.rsvpEnabled}
						disabled={isSaving}
						onChange={(event) =>
							setConfig((current) =>
								current
									? { ...current, rsvpEnabled: event.target.checked }
									: current,
							)
						}
					/>
					<span>
						<span className="block font-medium">Aktifkan RSVP</span>
						<span className="block text-sm text-muted-foreground">
							Izinkan tamu memberikan konfirmasi kehadiran.
						</span>
					</span>
				</label>

				<label className="flex items-start gap-3 rounded-md border border-border p-4">
					<input
						type="checkbox"
						checked={config.wishesEnabled}
						disabled={isSaving}
						onChange={(event) =>
							setConfig((current) =>
								current
									? { ...current, wishesEnabled: event.target.checked }
									: current,
							)
						}
					/>
					<span>
						<span className="block font-medium">Aktifkan ucapan</span>
						<span className="block text-sm text-muted-foreground">
							Izinkan tamu mengirimkan doa dan ucapan.
						</span>
					</span>
				</label>

				{error && (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
				{message && (
					<p role="status" className="text-sm text-success">
						{message}
					</p>
				)}
				<button
					type="submit"
					disabled={isSaving}
					className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
				>
					{isSaving ? "Menyimpan..." : "Simpan pengaturan"}
				</button>
			</form>
		</section>
	);
}
