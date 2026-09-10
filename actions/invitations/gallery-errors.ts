const controlledGalleryErrors: Record<string, string> = {
	gallery_unauthenticated: "Silakan masuk untuk mengelola galeri.",
	gallery_access_denied: "Tidak memiliki akses ke galeri ini.",
	gallery_image_limit_reached:
		"Batas gambar untuk paket undangan telah tercapai.",
	gallery_youtube_limit_reached:
		"Batas video YouTube untuk paket undangan telah tercapai.",
	gallery_invalid_media: "Jenis media galeri tidak valid.",
	gallery_invalid_data: "Data galeri tidak valid.",
};

export function getGalleryActionError(error: unknown) {
	const message =
		typeof error === "object" && error !== null && "message" in error
			? String(error.message)
			: "";
	for (const [identifier, controlledMessage] of Object.entries(
		controlledGalleryErrors,
	)) {
		if (message === identifier) return new Error(controlledMessage);
	}
	return new Error("Operasi galeri gagal.");
}
