import { z } from "zod";

const nullableCoordinate = (minimum: number, maximum: number) =>
	z.number().min(minimum).max(maximum).nullable();

export const eventInputSchema = z
	.object({
		name: z.string().trim().min(1, "Nama acara wajib diisi."),
		eventDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal acara tidak valid."),
		startTime: z
			.string()
			.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu mulai tidak valid."),
		endTime: z
			.string()
			.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu selesai tidak valid.")
			.nullable(),
		untilFinished: z.boolean(),
		address: z.string().trim().min(1, "Alamat acara wajib diisi."),
		latitude: nullableCoordinate(-90, 90),
		longitude: nullableCoordinate(-180, 180),
		isMainEvent: z.boolean(),
		sortOrder: z.number().int().nonnegative(),
	})
	.superRefine((event, context) => {
		if ((event.latitude === null) !== (event.longitude === null)) {
			context.addIssue({
				code: "custom",
				message: "Latitude dan longitude harus diisi berpasangan.",
				path: event.latitude === null ? ["latitude"] : ["longitude"],
			});
		}
	});

export const eventIdSchema = z.string().uuid("Event ID tidak valid.");
export const invitationIdSchema = z.string().uuid("Invitation ID tidak valid.");

export const reorderEventsSchema = z
	.array(eventIdSchema)
	.superRefine((eventIds, context) => {
		if (new Set(eventIds).size !== eventIds.length) {
			context.addIssue({
				code: "custom",
				message: "Urutan event mengandung ID duplikat.",
			});
		}
	});

export type EventInput = z.infer<typeof eventInputSchema>;

export function normalizeEventInput(input: EventInput): EventInput {
	return {
		...input,
		endTime: input.untilFinished ? null : input.endTime,
	};
}
