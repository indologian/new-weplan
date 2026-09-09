import { afterEach, describe, expect, it, vi } from "vitest";
import { createSlugAvailabilityChecker } from "./slug-availability";

describe("slug availability checker", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("debounces so only the latest scheduled slug is requested", async () => {
		vi.useFakeTimers();
		const fetcher = vi.fn().mockResolvedValue(true);
		const onResult = vi.fn();
		const checker = createSlugAvailabilityChecker(fetcher, onResult, 400);

		checker.check("first-slug");
		checker.check("latest-slug");
		await vi.advanceTimersByTimeAsync(400);

		expect(fetcher).toHaveBeenCalledOnce();
		expect(fetcher).toHaveBeenCalledWith(
			"latest-slug",
			expect.any(AbortSignal),
		);
		expect(onResult).toHaveBeenCalledWith("latest-slug", true);
	});

	it("ignores a stale response after a newer check starts", async () => {
		vi.useFakeTimers();
		let resolveFirst: ((value: boolean) => void) | undefined;
		const fetcher = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise<boolean>((resolve) => {
						resolveFirst = resolve;
					}),
			)
			.mockResolvedValueOnce(true);
		const onResult = vi.fn();
		const checker = createSlugAvailabilityChecker(fetcher, onResult, 400);

		checker.check("old-slug");
		await vi.advanceTimersByTimeAsync(400);
		checker.check("new-slug");
		await vi.advanceTimersByTimeAsync(400);
		resolveFirst?.(false);
		await Promise.resolve();

		expect(onResult).toHaveBeenCalledTimes(1);
		expect(onResult).toHaveBeenCalledWith("new-slug", true);
	});
});
