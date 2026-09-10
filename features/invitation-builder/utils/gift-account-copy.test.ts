import { describe, expect, it, vi } from "vitest";
import { copyGiftAccountNumber } from "./gift-account-copy";

describe("gift account copy presentation", () => {
	it("copies the exact persisted string including leading zeroes", async () => {
		const writeText = vi.fn(async () => undefined);
		await copyGiftAccountNumber("001234567890", writeText);
		expect(writeText).toHaveBeenCalledExactlyOnceWith("001234567890");
	});
});
