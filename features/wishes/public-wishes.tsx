"use client";

import { useCallback, useEffect, useState } from "react";

type PublicWish = {
	name: string;
	message: string;
	createdAt: string;
	isMine: boolean;
};

export function wishesEndpoint(guestToken: string) {
	return `/api/invite/${encodeURIComponent(guestToken)}/wishes`;
}

export function wishEndpoint(guestToken: string) {
	return `/api/invite/${encodeURIComponent(guestToken)}/wish`;
}

export function PublicWishes({ guestToken }: { guestToken: string }) {
	const [wishes, setWishes] = useState<PublicWish[]>([]);
	const [message, setMessage] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	const characterCount = [...message.trim()].length;

	const load = useCallback(async () => {
		const response = await fetch(wishesEndpoint(guestToken), {
			cache: "no-store",
		});
		if (!response.ok) throw new Error();
		const result = (await response.json()) as { wishes: PublicWish[] };
		setWishes(result.wishes);
		setMessage(result.wishes.find(({ isMine }) => isMine)?.message ?? "");
	}, [guestToken]);

	useEffect(() => {
		void load().catch(() => setError("Ucapan tidak dapat dimuat."));
	}, [load]);

	async function submit() {
		setPending(true);
		setError("");
		try {
			const response = await fetch(wishEndpoint(guestToken), {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message }),
			});
			if (!response.ok) throw new Error();
			await load();
		} catch {
			setError("Ucapan tidak dapat disimpan.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<label className="block font-medium" htmlFor="public-wish-message">
					Ucapan Anda
				</label>
				<textarea
					id="public-wish-message"
					rows={4}
					value={message}
					onChange={(event) => setMessage(event.currentTarget.value)}
					className="mt-2 w-full rounded-lg border p-3"
				/>
				<p className="mt-1 text-sm text-gray-500">
					{characterCount}/500 karakter
				</p>
				<button
					type="button"
					disabled={pending || characterCount < 1 || characterCount > 500}
					onClick={() => void submit()}
					className="mt-3 w-full rounded-full bg-theme-primary px-6 py-2 font-bold text-white disabled:opacity-50"
				>
					{pending
						? "Menyimpan…"
						: wishes.some(({ isMine }) => isMine)
							? "Ubah Ucapan"
							: "Kirim Ucapan"}
				</button>
			</div>
			{error && <p role="alert">{error}</p>}
			<div className="max-h-96 space-y-4 overflow-y-auto pr-2">
				{wishes.length === 0 && (
					<p className="text-center text-gray-500">Belum ada ucapan.</p>
				)}
				{wishes.map((wish, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: public response intentionally excludes database identifiers
					<div key={index} className="border-b pb-4 last:border-0">
						<p className="font-bold text-theme-primary">
							{wish.name} {wish.isMine && <span>(Anda)</span>}
						</p>
						<p className="mb-1 text-sm text-gray-500">
							{new Date(wish.createdAt).toLocaleDateString()}
						</p>
						<p className="text-theme-text">{wish.message}</p>
					</div>
				))}
			</div>
		</div>
	);
}
