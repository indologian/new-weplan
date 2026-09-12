"use server";

import { permanentlyDeleteInvitationService } from "./delete-service";

export async function permanentlyDeleteInvitation(input: unknown) {
	return permanentlyDeleteInvitationService(input);
}
