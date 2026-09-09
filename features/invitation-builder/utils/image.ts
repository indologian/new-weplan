export async function compressImageToWebP(file: File): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				// Target max dimension 1920px
				const MAX_SIZE = 1920;
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > MAX_SIZE) {
						height *= MAX_SIZE / width;
						width = MAX_SIZE;
					}
				} else {
					if (height > MAX_SIZE) {
						width *= MAX_SIZE / height;
						height = MAX_SIZE;
					}
				}

				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					return reject(new Error("Failed to get canvas context"));
				}

				ctx.drawImage(img, 0, 0, width, height);

				// Start with 0.8 quality, recursive compression could be used, but this is simple MVP
				canvas.toBlob(
					(blob) => {
						if (!blob) return reject(new Error("Failed to create blob"));
						resolve(blob);
					},
					"image/webp",
					0.8,
				);
			};
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = event.target?.result as string;
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}
