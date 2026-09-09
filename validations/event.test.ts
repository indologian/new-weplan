import { describe, expect, it } from "vitest";
import {
	eventInputSchema,
	normalizeEventInput,
	reorderEventsSchema,
} from "./event";

const validEvent = {
	name: "Akad",
	eventDate: "2026-12-20",
	startTime: "09:00",
	endTime: "11:00",
	untilFinished: false,
	address: "Masjid Agung",
	latitude: -6.2,
	longitude: 106.8,
	isMainEvent: true,
	sortOrder: 0,
};

describe("event validation", () => {
	it("accepts a valid event contract", () => {
		expect(eventInputSchema.safeParse(validEvent).success).toBe(true);
	});

	it("normalizes end time when the event runs until finished", () => {
		const parsed = eventInputSchema.parse({
			...validEvent,
			untilFinished: true,
		});

		expect(normalizeEventInput(parsed).endTime).toBeNull();
	});

	it.each([
		{ latitude: -90.1, longitude: 106.8 },
		{ latitude: 90.1, longitude: 106.8 },
		{ latitude: -6.2, longitude: -180.1 },
		{ latitude: -6.2, longitude: 180.1 },
	])("rejects coordinates outside their ranges", (coordinates) => {
		expect(
			eventInputSchema.safeParse({ ...validEvent, ...coordinates }).success,
		).toBe(false);
	});

	it.each([
		{ latitude: -6.2, longitude: null },
		{ latitude: null, longitude: 106.8 },
	])("rejects half coordinates", (coordinates) => {
		expect(
			eventInputSchema.safeParse({ ...validEvent, ...coordinates }).success,
		).toBe(false);
	});

	it("rejects duplicate IDs during reorder", () => {
		const id = "00000000-0000-4000-8000-000000000001";
		expect(reorderEventsSchema.safeParse([id, id]).success).toBe(false);
	});
});
