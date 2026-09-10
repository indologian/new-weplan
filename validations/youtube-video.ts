const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"youtu.be",
]);

export function normalizeYouTubeVideoId(input: unknown) {
	if (typeof input !== "string") throw new Error("Video YouTube tidak valid.");
	const value = input.trim();
	if (youtubeIdPattern.test(value)) return value;
	if (/[<>]/.test(value)) throw new Error("Video YouTube tidak valid.");

	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error("Video YouTube tidak valid.");
	}
	if (url.protocol !== "https:" || !youtubeHosts.has(url.hostname)) {
		throw new Error("Video YouTube tidak valid.");
	}

	let candidate: string | null = null;
	if (url.hostname === "youtu.be")
		candidate = url.pathname.split("/")[1] ?? null;
	else if (url.pathname === "/watch") candidate = url.searchParams.get("v");
	else {
		const match = url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)\/?$/);
		candidate = match?.[1] ?? null;
	}
	if (!candidate || !youtubeIdPattern.test(candidate)) {
		throw new Error("Video YouTube tidak valid.");
	}
	return candidate;
}
