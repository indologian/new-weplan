import { describe, expect, it } from "vitest";
import { elegantGreenMotionPolicy } from "./animations";

describe("elegant green motion policy", () => {
	it("honors the user's reduced reduced-motion preference", () => {
		expect(elegantGreenMotionPolicy.reducedMotion).toBe("user");
	});
});
