"use client";

import { useEffect, useState } from "react";

type Attendance = "attending" | "not_attending";
type RsvpState = {
	attendance: Attendance | null;
	guestCount: number;
	responded: boolean;
};

export function rsvpEndpoint(guestToken: string) {
	return `/api/invite/${encodeURIComponent(guestToken)}/rsvp`;
}

export function PublicRsvp({ guestToken }: { guestToken: string }) {
	const [state, setState] = useState<RsvpState | null>(null);
	const [attendance, setAttendance] = useState<Attendance>("attending");
	const [guestCount, setGuestCount] = useState(1);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let current = true;
		void fetch(rsvpEndpoint(guestToken), { cache: "no-store" })
			.then(async (response) => {
				if (!response.ok) throw new Error();
				return (await response.json()) as RsvpState;
			})
			.then((result) => {
				if (!current) return;
				setState(result);
				if (result.attendance) setAttendance(result.attendance);
				setGuestCount(
					result.attendance === "attending" ? result.guestCount : 1,
				);
			})
			.catch(() => {
				if (current) setError("RSVP tidak dapat dimuat.");
			});
		return () => {
			current = false;
		};
	}, [guestToken]);

	async function submit() {
		setPending(true);
		setError("");
		try {
			const response = await fetch(rsvpEndpoint(guestToken), {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ attendance, guestCount }),
			});
			if (!response.ok) throw new Error();
			setState((await response.json()) as RsvpState);
		} catch {
			setError("RSVP tidak dapat disimpan.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="space-y-4">
			{state?.responded && <p>Respons tersimpan. Anda dapat mengubahnya.</p>}
			<div className="flex flex-wrap justify-center gap-3">
				<button
					type="button"
					onClick={() => setAttendance("attending")}
					aria-pressed={attendance === "attending"}
					className="rounded-full bg-white px-6 py-2 font-bold text-theme-primary"
				>
					Hadir
				</button>
				<button
					type="button"
					onClick={() => setAttendance("not_attending")}
					aria-pressed={attendance === "not_attending"}
					className="rounded-full border border-white px-6 py-2 font-bold text-white"
				>
					Tidak hadir
				</button>
			</div>
			{attendance === "attending" && (
				<label className="mx-auto block max-w-48 text-left">
					Jumlah tamu
					<input
						type="number"
						min={1}
						step={1}
						value={guestCount}
						onChange={(event) =>
							setGuestCount(event.currentTarget.valueAsNumber)
						}
						className="mt-1 w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-theme-text"
					/>
				</label>
			)}
			<button
				type="button"
				disabled={
					pending ||
					(attendance === "attending" &&
						(!Number.isInteger(guestCount) || guestCount < 1))
				}
				onClick={() => void submit()}
				className="rounded-full bg-white px-7 py-2 font-bold text-theme-primary disabled:opacity-50"
			>
				{pending ? "Menyimpan…" : state?.responded ? "Ubah RSVP" : "Kirim RSVP"}
			</button>
			{error && <p role="alert">{error}</p>}
		</div>
	);
}
