"use client";

import { useEffect, useState } from "react";
import {
	createYouTubeGalleryItem,
	deleteGalleryItem,
	getGalleryItems,
	reorderGalleryItems,
} from "@/actions/invitations/gallery";
import {
	createGalleryImageUploadUrl,
	persistGalleryImage,
} from "@/actions/invitations/gallery-image";
import type { GalleryItem } from "@/validations/gallery";
import { compressImageToWebP } from "../utils/image";

export function GalleryForm({ invitationId }: { invitationId: string }) {
	const [items, setItems] = useState<GalleryItem[]>([]);
	const [youtubeInput, setYoutubeInput] = useState("");
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reload = async () => setItems(await getGalleryItems(invitationId));

	useEffect(() => {
		getGalleryItems(invitationId)
			.then(setItems)
			.catch((loadError: Error) => setError(loadError.message));
	}, [invitationId]);

	const run = async (operation: () => Promise<void>) => {
		setIsBusy(true);
		setError(null);
		try {
			await operation();
			await reload();
		} catch (operationError) {
			setError((operationError as Error).message);
		} finally {
			setIsBusy(false);
		}
	};

	const uploadImage = async (file: File) => {
		await run(async () => {
			const image = await compressImageToWebP(file);
			const { galleryItemId, signedUrl } =
				await createGalleryImageUploadUrl(invitationId);
			const response = await fetch(signedUrl, {
				method: "PUT",
				body: image,
				headers: { "Content-Type": "image/webp" },
			});
			if (!response.ok) throw new Error("Gagal mengunggah gambar galeri.");
			await persistGalleryImage(invitationId, galleryItemId);
		});
	};

	const moveItem = async (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		const reordered = [...items];
		[reordered[index], reordered[target]] = [
			reordered[target],
			reordered[index],
		];
		await run(() =>
			reorderGalleryItems(
				invitationId,
				reordered.map(({ id }) => id),
			),
		);
	};

	return (
		<section
			id="gallery-step"
			className="space-y-6"
			aria-labelledby="gallery-title"
		>
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<h2 id="gallery-title" className="mb-4 text-xl font-bold">
					Galeri
				</h2>
				{items.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Belum ada media galeri.
					</p>
				) : (
					<ol className="space-y-3">
						{items.map((item, index) => (
							<li key={item.id} className="rounded-md border border-border p-4">
								<p className="font-medium">
									{item.type === "image" ? "Gambar galeri" : "Video YouTube"}
								</p>
								{item.type === "youtube" && item.youtubeVideoId && (
									<a
										href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-primary underline"
									>
										Lihat video
									</a>
								)}
								<div className="mt-3 flex flex-wrap gap-3">
									<button
										type="button"
										disabled={isBusy || index === 0}
										onClick={() => moveItem(index, -1)}
									>
										Naik
									</button>
									<button
										type="button"
										disabled={isBusy || index === items.length - 1}
										onClick={() => moveItem(index, 1)}
									>
										Turun
									</button>
									<button
										type="button"
										disabled={isBusy}
										onClick={() =>
											run(() => deleteGalleryItem(invitationId, item.id))
										}
									>
										Hapus
									</button>
								</div>
							</li>
						))}
					</ol>
				)}
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<h3 className="mb-3 text-lg font-bold">Tambah gambar</h3>
					<input
						type="file"
						accept="image/*"
						disabled={isBusy}
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) uploadImage(file);
							event.target.value = "";
						}}
					/>
				</div>
				<form
					className="rounded-lg border border-border bg-card p-6 shadow-sm"
					onSubmit={(event) => {
						event.preventDefault();
						run(async () => {
							await createYouTubeGalleryItem(invitationId, youtubeInput);
							setYoutubeInput("");
						});
					}}
				>
					<h3 className="mb-3 text-lg font-bold">Tambah video YouTube</h3>
					<label className="block text-sm font-medium">
						URL atau video ID
						<input
							required
							value={youtubeInput}
							onChange={(event) => setYoutubeInput(event.target.value)}
							className="mt-1 w-full rounded-md border border-border px-3 py-2"
						/>
					</label>
					<button
						type="submit"
						disabled={isBusy}
						className="mt-3 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
					>
						Tambah video
					</button>
				</form>
			</div>
			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}
		</section>
	);
}
