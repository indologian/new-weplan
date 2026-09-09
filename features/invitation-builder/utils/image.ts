export const MAX_IMAGE_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_OUTPUT_BYTES = 500 * 1024;
export const MAX_IMAGE_DIMENSION = 1920;

type ImageInput = Pick<File, "size" | "type">;

export function validateImageInput(file: ImageInput): void {
	if (!file.type.startsWith("image/")) {
		throw new Error("File harus berupa gambar.");
	}
	if (file.size > MAX_IMAGE_INPUT_BYTES) {
		throw new Error("Ukuran gambar awal maksimal 10 MB.");
	}
}

function readImage(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
			image.src = event.target?.result as string;
		};
		reader.onerror = () => reject(new Error("File tidak dapat dibaca."));
		reader.readAsDataURL(file);
	});
}

function encodeWebP(
	image: HTMLImageElement,
	width: number,
	height: number,
	quality: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");

		if (!context) {
			reject(new Error("Gambar tidak dapat diproses."));
			return;
		}

		context.drawImage(image, 0, 0, width, height);
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Gambar WebP tidak dapat dibuat."));
					return;
				}
				resolve(blob);
			},
			"image/webp",
			quality,
		);
	});
}

export async function compressImageToWebP(file: File): Promise<Blob> {
	validateImageInput(file);
	const image = await readImage(file);
	const initialScale = Math.min(
		1,
		MAX_IMAGE_DIMENSION / Math.max(image.width, image.height),
	);
	let width = Math.max(1, Math.round(image.width * initialScale));
	let height = Math.max(1, Math.round(image.height * initialScale));
	const qualities = [0.82, 0.68, 0.54, 0.4];

	for (let resizeAttempt = 0; resizeAttempt < 8; resizeAttempt += 1) {
		for (const quality of qualities) {
			const blob = await encodeWebP(image, width, height, quality);
			if (blob.size <= MAX_IMAGE_OUTPUT_BYTES) {
				return blob;
			}
		}

		width = Math.max(1, Math.round(width * 0.8));
		height = Math.max(1, Math.round(height * 0.8));
	}

	throw new Error("Gambar tidak dapat dioptimalkan hingga maksimal 500 KB.");
}
