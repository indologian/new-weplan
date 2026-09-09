export type SlugAvailabilityFetcher = (
	slug: string,
	signal: AbortSignal,
) => Promise<boolean>;

export function createSlugAvailabilityChecker(
	fetchAvailability: SlugAvailabilityFetcher,
	onResult: (slug: string, available: boolean) => void,
	delay = 500,
) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let requestSequence = 0;
	let activeController: AbortController | null = null;

	function cancel() {
		requestSequence += 1;
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		activeController?.abort();
		activeController = null;
	}

	function check(slug: string) {
		cancel();
		const sequence = requestSequence;

		timer = setTimeout(async () => {
			timer = null;
			const controller = new AbortController();
			activeController = controller;

			try {
				const available = await fetchAvailability(slug, controller.signal);
				if (!controller.signal.aborted && sequence === requestSequence) {
					onResult(slug, available);
				}
			} catch (error) {
				if (
					!(error instanceof DOMException && error.name === "AbortError") &&
					sequence === requestSequence
				) {
					onResult(slug, false);
				}
			}
		}, delay);
	}

	return { cancel, check };
}

export async function fetchSlugAvailability(
	slug: string,
	signal: AbortSignal,
): Promise<boolean> {
	const response = await fetch(
		`/api/invitations/slug-availability?slug=${encodeURIComponent(slug)}`,
		{ signal },
	);
	const data: unknown = await response.json();

	return (
		response.ok &&
		typeof data === "object" &&
		data !== null &&
		"slug" in data &&
		data.slug === slug &&
		"available" in data &&
		data.available === true
	);
}
