import { z } from "zod";

export const interactionInvitationIdSchema = z.string().uuid();

export const interactionConfigSchema = z.object({
	rsvpEnabled: z.boolean(),
	wishesEnabled: z.boolean(),
});

export type InteractionConfig = z.infer<typeof interactionConfigSchema>;
