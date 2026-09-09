"use client";

import { useEffect, useState } from "react";
import {
	createStory,
	deleteStory,
	getStories,
	reorderStories,
	updateStory,
} from "@/actions/invitations/stories";
import {
	createStoryImageUploadUrl,
	persistStoryImage,
} from "@/actions/invitations/story-image";
import type { Story, StoryContentInput } from "@/validations/story";
import { compressImageToWebP } from "../utils/image";

const emptyStory: StoryContentInput = {
	title: "",
	storyDate: null,
	description: "",
	sortOrder: 0,
};

export function StoriesForm({ invitationId }: { invitationId: string }) {
	const [stories, setStories] = useState<Story[]>([]);
	const [draft, setDraft] = useState<StoryContentInput>(emptyStory);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reload = async () => setStories(await getStories(invitationId));

	useEffect(() => {
		getStories(invitationId)
			.then(setStories)
			.catch((loadError: Error) => setError(loadError.message));
	}, [invitationId]);

	const resetDraft = () => {
		setDraft(emptyStory);
		setEditingId(null);
	};

	const submitStory = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsBusy(true);
		setError(null);
		try {
			if (editingId) await updateStory(invitationId, editingId, draft);
			else await createStory(invitationId, draft);
			resetDraft();
			await reload();
		} catch (submitError) {
			setError((submitError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const uploadImage = async (storyId: string, file: File) => {
		setIsBusy(true);
		setError(null);
		try {
			const image = await compressImageToWebP(file);
			const { signedUrl } = await createStoryImageUploadUrl(
				invitationId,
				storyId,
			);
			const response = await fetch(signedUrl, {
				method: "PUT",
				body: image,
				headers: { "Content-Type": "image/webp" },
			});
			if (!response.ok) throw new Error("Gagal mengunggah gambar cerita.");
			await persistStoryImage(invitationId, storyId);
			await reload();
		} catch (uploadError) {
			setError((uploadError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const moveStory = async (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= stories.length) return;
		const reordered = [...stories];
		[reordered[index], reordered[target]] = [
			reordered[target],
			reordered[index],
		];
		setIsBusy(true);
		setError(null);
		try {
			await reorderStories(
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
			id="stories-step"
			className="space-y-6"
			aria-labelledby="stories-title"
		>
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 id="stories-title" className="mb-4 text-xl font-bold">
					Kisah Kami
				</h2>
				{stories.length === 0 ? (
					<p className="text-sm text-muted-foreground">Belum ada cerita.</p>
				) : (
					<ol className="space-y-3">
						{stories.map((story, index) => (
							<li
								key={story.id}
								className="rounded-md border border-border p-4"
							>
								<h3 className="font-semibold">{story.title}</h3>
								{story.storyDate && (
									<p className="text-sm text-muted-foreground">
										{story.storyDate}
									</p>
								)}
								<p className="my-2 text-sm">{story.description}</p>
								<p className="mb-2 text-xs text-muted-foreground">
									{story.imagePath ? "Gambar tersimpan" : "Tanpa gambar"}
								</p>
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										disabled={isBusy || index === 0}
										onClick={() => moveStory(index, -1)}
									>
										Naik
									</button>
									<button
										type="button"
										disabled={isBusy || index === stories.length - 1}
										onClick={() => moveStory(index, 1)}
									>
										Turun
									</button>
									<button
										type="button"
										disabled={isBusy}
										onClick={() => {
											setEditingId(story.id);
											setDraft(story);
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
												await deleteStory(invitationId, story.id);
												if (editingId === story.id) resetDraft();
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
									<label className="cursor-pointer">
										{story.imagePath ? "Ganti gambar" : "Tambah gambar"}
										<input
											className="sr-only"
											type="file"
											accept="image/*"
											disabled={isBusy}
											onChange={(event) => {
												const file = event.target.files?.[0];
												if (file) uploadImage(story.id, file);
												event.target.value = "";
											}}
										/>
									</label>
								</div>
							</li>
						))}
					</ol>
				)}
			</div>

			<form
				onSubmit={submitStory}
				className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
			>
				<h3 className="text-lg font-bold">
					{editingId ? "Edit cerita" : "Tambah cerita"}
				</h3>
				<label className="block text-sm font-medium">
					Judul
					<input
						required
						className="mt-1 w-full rounded-md border border-border px-3 py-2"
						value={draft.title}
						onChange={(event) =>
							setDraft((current) => ({ ...current, title: event.target.value }))
						}
					/>
				</label>
				<label className="block text-sm font-medium">
					Tanggal opsional
					<input
						type="date"
						className="mt-1 w-full rounded-md border border-border px-3 py-2"
						value={draft.storyDate ?? ""}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								storyDate: event.target.value || null,
							}))
						}
					/>
				</label>
				<label className="block text-sm font-medium">
					Cerita
					<textarea
						required
						rows={4}
						className="mt-1 w-full rounded-md border border-border px-3 py-2"
						value={draft.description}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								description: event.target.value,
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
								: "Tambah cerita"}
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
