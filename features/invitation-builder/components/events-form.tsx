"use client";

import { useEffect, useState } from "react";
import {
	createWeddingEvent,
	deleteWeddingEvent,
	getWeddingEvents,
	reorderWeddingEvents,
	setMainWeddingEvent,
	updateWeddingEvent,
	type WeddingEvent,
} from "@/actions/invitations/events";
import type { EventInput } from "@/validations/event";

type EventsFormProps = {
	invitationId: string;
};

const emptyEvent: EventInput = {
	name: "",
	eventDate: "",
	startTime: "",
	endTime: null,
	untilFinished: false,
	address: "",
	latitude: null,
	longitude: null,
	isMainEvent: false,
	sortOrder: 0,
};

function optionalCoordinate(value: string) {
	return value.trim() === "" ? null : Number(value);
}

export function EventsForm({ invitationId }: EventsFormProps) {
	const [events, setEvents] = useState<WeddingEvent[]>([]);
	const [draft, setDraft] = useState<EventInput>(emptyEvent);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reload = async () => {
		setEvents(await getWeddingEvents(invitationId));
	};

	useEffect(() => {
		getWeddingEvents(invitationId)
			.then(setEvents)
			.catch((loadError: Error) => setError(loadError.message));
	}, [invitationId]);

	const updateDraft = <Key extends keyof EventInput>(
		key: Key,
		value: EventInput[Key],
	) => setDraft((current) => ({ ...current, [key]: value }));

	const resetDraft = () => {
		setDraft(emptyEvent);
		setEditingId(null);
	};

	const submitEvent = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsBusy(true);
		setError(null);
		try {
			if (editingId) {
				await updateWeddingEvent(invitationId, editingId, draft);
			} else {
				await createWeddingEvent(invitationId, draft);
			}
			resetDraft();
			await reload();
		} catch (submitError) {
			setError((submitError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const editEvent = (event: WeddingEvent) => {
		setEditingId(event.id);
		setDraft(event);
	};

	const removeEvent = async (eventId: string) => {
		setIsBusy(true);
		setError(null);
		try {
			await deleteWeddingEvent(invitationId, eventId);
			if (editingId === eventId) resetDraft();
			await reload();
		} catch (deleteError) {
			setError((deleteError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const chooseMainEvent = async (eventId: string) => {
		setIsBusy(true);
		setError(null);
		try {
			await setMainWeddingEvent(invitationId, eventId);
			await reload();
		} catch (mainError) {
			setError((mainError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const moveEvent = async (index: number, direction: -1 | 1) => {
		const targetIndex = index + direction;
		if (targetIndex < 0 || targetIndex >= events.length) return;
		const reordered = [...events];
		[reordered[index], reordered[targetIndex]] = [
			reordered[targetIndex],
			reordered[index],
		];
		setIsBusy(true);
		setError(null);
		try {
			await reorderWeddingEvents(
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

	const fieldClass =
		"mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary";

	return (
		<section
			id="events-step"
			className="space-y-6"
			aria-labelledby="events-title"
		>
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 id="events-title" className="mb-4 text-xl font-bold">
					Acara Pernikahan
				</h2>
				{events.length === 0 ? (
					<p className="text-sm text-muted-foreground">Belum ada acara.</p>
				) : (
					<ol className="space-y-3">
						{events.map((weddingEvent, index) => (
							<li
								key={weddingEvent.id}
								className="rounded-md border border-border p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<label className="flex items-center gap-2 font-semibold">
											<input
												type="radio"
												name="main-event"
												checked={weddingEvent.isMainEvent}
												onChange={() => chooseMainEvent(weddingEvent.id)}
												disabled={isBusy}
											/>
											{weddingEvent.name}
										</label>
										<p className="text-sm text-muted-foreground">
											{weddingEvent.eventDate} · {weddingEvent.startTime}
											{weddingEvent.untilFinished
												? " - Selesai"
												: weddingEvent.endTime
													? ` - ${weddingEvent.endTime}`
													: ""}
										</p>
										<p className="text-sm">{weddingEvent.address}</p>
									</div>
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() => moveEvent(index, -1)}
											disabled={isBusy || index === 0}
										>
											Naik
										</button>
										<button
											type="button"
											onClick={() => moveEvent(index, 1)}
											disabled={isBusy || index === events.length - 1}
										>
											Turun
										</button>
										<button
											type="button"
											onClick={() => editEvent(weddingEvent)}
											disabled={isBusy}
										>
											Edit
										</button>
										<button
											type="button"
											onClick={() => removeEvent(weddingEvent.id)}
											disabled={isBusy}
										>
											Hapus
										</button>
									</div>
								</div>
							</li>
						))}
					</ol>
				)}
			</div>

			<form
				onSubmit={submitEvent}
				className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
			>
				<h3 className="text-lg font-bold">
					{editingId ? "Edit acara" : "Tambah acara"}
				</h3>
				<label className="block text-sm font-medium">
					Nama acara
					<input
						required
						value={draft.name}
						onChange={(event) => updateDraft("name", event.target.value)}
						className={fieldClass}
					/>
				</label>
				<div className="grid gap-4 sm:grid-cols-3">
					<label className="block text-sm font-medium">
						Tanggal
						<input
							required
							type="date"
							value={draft.eventDate}
							onChange={(event) => updateDraft("eventDate", event.target.value)}
							className={fieldClass}
						/>
					</label>
					<label className="block text-sm font-medium">
						Mulai
						<input
							required
							type="time"
							value={draft.startTime}
							onChange={(event) => updateDraft("startTime", event.target.value)}
							className={fieldClass}
						/>
					</label>
					<label className="block text-sm font-medium">
						Selesai
						<input
							type="time"
							value={draft.endTime ?? ""}
							onChange={(event) =>
								updateDraft("endTime", event.target.value || null)
							}
							disabled={draft.untilFinished}
							className={fieldClass}
						/>
					</label>
				</div>
				<label className="flex items-center gap-2 text-sm font-medium">
					<input
						type="checkbox"
						checked={draft.untilFinished}
						onChange={(event) =>
							updateDraft("untilFinished", event.target.checked)
						}
					/>
					Sampai selesai
				</label>
				<label className="block text-sm font-medium">
					Alamat
					<textarea
						required
						value={draft.address}
						onChange={(event) => updateDraft("address", event.target.value)}
						className={fieldClass}
						rows={3}
					/>
				</label>
				<div className="grid gap-4 sm:grid-cols-2">
					<label className="block text-sm font-medium">
						Latitude
						<input
							type="number"
							min={-90}
							max={90}
							step="any"
							value={draft.latitude ?? ""}
							onChange={(event) =>
								updateDraft("latitude", optionalCoordinate(event.target.value))
							}
							className={fieldClass}
						/>
					</label>
					<label className="block text-sm font-medium">
						Longitude
						<input
							type="number"
							min={-180}
							max={180}
							step="any"
							value={draft.longitude ?? ""}
							onChange={(event) =>
								updateDraft("longitude", optionalCoordinate(event.target.value))
							}
							className={fieldClass}
						/>
					</label>
				</div>
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
								: "Tambah acara"}
					</button>
					{editingId && (
						<button type="button" onClick={resetDraft} disabled={isBusy}>
							Batal
						</button>
					)}
				</div>
			</form>
		</section>
	);
}
