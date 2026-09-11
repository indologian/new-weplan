import { z } from "zod";

export const dashboardInvitationIdSchema = z.string().uuid();
export const dashboardChildIdSchema = z.string().uuid();

export const dashboardGuestNameSchema = z
	.string()
	.trim()
	.min(1, "Nama tamu wajib diisi.")
	.max(200, "Nama tamu terlalu panjang.");

export const dashboardSectionSchema = z.enum([
	"overview",
	"invitations",
	"guests",
	"rsvp",
	"wishes",
	"gifts",
	"settings",
]);

export type DashboardSection = z.infer<typeof dashboardSectionSchema>;
