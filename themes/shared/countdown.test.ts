import { describe, expect, it } from "vitest";
import { mockInvitation } from "../fixtures";
import { getCountdownParts, getMainEventCountdownTarget } from "./countdown";

describe("theme countdown", () => {
	it("uses only the event marked as main", () => {
		expect(getMainEventCountdownTarget(mockInvitation)).toBe(
			new Date(mockInvitation.events[0].date).getTime(),
		);
	});

	it("does not guess a target when no main event exists", () => {
		expect(
			getMainEventCountdownTarget({
				...mockInvitation,
				events: mockInvitation.events.map((event) => ({
					...event,
					isMainEvent: false,
				})),
			}),
		).toBeNull();
	});

	it("calculates deterministic non-negative countdown parts", () => {
		const now = Date.UTC(2026, 0, 1);
		const target = now + 2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000;

		expect(getCountdownParts(target, now)).toEqual({
			days: 2,
			hours: 3,
			minutes: 4,
			seconds: 5,
		});
		expect(getCountdownParts(now - 1, now)).toEqual({
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
		});
	});
});
