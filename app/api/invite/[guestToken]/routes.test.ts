import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
	getRsvp: vi.fn(),
	putRsvp: vi.fn(),
	getWishes: vi.fn(),
	putWish: vi.fn(),
}));
vi.mock("../../../../lib/invitee/rsvp", () => ({
	getInviteeRsvp: mocks.getRsvp,
	putInviteeRsvp: mocks.putRsvp,
}));
vi.mock("../../../../lib/invitee/wishes", () => ({
	getInviteeWishes: mocks.getWishes,
	putInviteeWish: mocks.putWish,
}));

import { InviteeInteractionError } from "../../../../lib/invitee/errors";
import { GET as getRsvp, PUT as putRsvp } from "./rsvp/route";
import { PUT as putWish } from "./wish/route";
import { GET as getWishes } from "./wishes/route";

const context = { params: Promise.resolve({ guestToken: "A".repeat(43) }) };

describe("invitee route handlers", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns safe RSVP and Wishes payloads", async () => {
		mocks.getRsvp.mockResolvedValue({
			attendance: null,
			guestCount: 0,
			responded: false,
		});
		mocks.getWishes.mockResolvedValue({ wishes: [] });
		expect(
			await (await getRsvp(new Request("http://test"), context)).json(),
		).toEqual({
			attendance: null,
			guestCount: 0,
			responded: false,
		});
		expect(
			await (await getWishes(new Request("http://test"), context)).json(),
		).toEqual({
			wishes: [],
		});
	});

	it("rejects malformed and unrelated RSVP body fields", async () => {
		for (const body of [
			"not-json",
			JSON.stringify({ attendance: "attending", guestCount: 0 }),
			JSON.stringify({ attendance: "attending", guestCount: 1, guestId: "x" }),
		]) {
			const response = await putRsvp(
				new Request("http://test", { method: "PUT", body }),
				context,
			);
			expect(response.status).toBe(400);
		}
		expect(mocks.putRsvp).not.toHaveBeenCalled();
	});

	it("normalizes not-attending and trims Wish input", async () => {
		mocks.putRsvp.mockResolvedValue({ responded: true });
		mocks.putWish.mockResolvedValue({ isMine: true });
		await putRsvp(
			new Request("http://test", {
				method: "PUT",
				body: JSON.stringify({ attendance: "not_attending", guestCount: 8 }),
			}),
			context,
		);
		await putWish(
			new Request("http://test", {
				method: "PUT",
				body: JSON.stringify({ message: "  Selamat  " }),
			}),
			context,
		);
		expect(mocks.putRsvp).toHaveBeenCalledWith("A".repeat(43), {
			attendance: "not_attending",
			guestCount: 0,
		});
		expect(mocks.putWish).toHaveBeenCalledWith("A".repeat(43), {
			message: "Selamat",
		});
	});

	it("maps authorization failures to one generic public response", async () => {
		mocks.getRsvp.mockRejectedValue(new InviteeInteractionError("not_found"));
		const response = await getRsvp(new Request("http://test"), context);
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: "Interaksi undangan tidak tersedia.",
		});
	});
});
