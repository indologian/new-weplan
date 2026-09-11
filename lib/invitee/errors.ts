import "server-only";

export class InviteeInteractionError extends Error {
	constructor(public readonly kind: "not_found" | "server_error") {
		super("Interaksi undangan tidak tersedia.");
		this.name = "InviteeInteractionError";
	}
}
