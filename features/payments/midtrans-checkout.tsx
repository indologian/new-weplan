"use client";

import { useState } from "react";
import { startPaymentCheckout } from "../../actions/payments/checkout";

declare global {
	interface Window {
		snap?: { pay(token: string, callbacks: Record<string, () => void>): void };
	}
}

function loadSnapScript(src: string, clientKey: string) {
	if (window.snap) return Promise.resolve();
	return new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${src}"]`,
		);
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => reject(new Error("Snap gagal dimuat.")),
				{ once: true },
			);
			return;
		}
		const script = document.createElement("script");
		script.src = src;
		script.dataset.clientKey = clientKey;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Snap gagal dimuat."));
		document.head.appendChild(script);
	});
}

export function MidtransCheckout({ invitationId }: { invitationId: string }) {
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState(
		"Pembayaran diverifikasi melalui Midtrans sebelum undangan aktif.",
	);
	async function checkout() {
		setBusy(true);
		try {
			const result = await startPaymentCheckout({ invitationId });
			await loadSnapScript(result.snapScriptUrl, result.clientKey);
			if (!window.snap) throw new Error("Snap tidak tersedia.");
			window.snap.pay(result.token, {
				onSuccess: () => setMessage("Pembayaran sedang diverifikasi."),
				onPending: () => setMessage("Pembayaran masih menunggu penyelesaian."),
				onError: () => setMessage("Pembayaran gagal. Silakan periksa kembali."),
				onClose: () => setMessage("Jendela pembayaran ditutup."),
			});
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Checkout gagal dimulai.",
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<div data-checkout-invitation-id={invitationId}>
			<button
				type="button"
				disabled={busy}
				onClick={checkout}
				className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
			>
				{busy ? "Menyiapkan pembayaran…" : "Bayar & Publish"}
			</button>
			<p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
				{message}
			</p>
		</div>
	);
}
