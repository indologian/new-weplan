import { NextResponse } from "next/server";
import { InviteeInteractionError } from "../../../../lib/invitee/errors";

export function inviteeFailureResponse(error: unknown) {
	if (error instanceof InviteeInteractionError && error.kind === "not_found") {
		return NextResponse.json(
			{ error: "Interaksi undangan tidak tersedia." },
			{ status: 404 },
		);
	}
	return NextResponse.json(
		{ error: "Interaksi undangan tidak dapat diproses." },
		{ status: 500 },
	);
}

export function invalidBodyResponse() {
	return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
}
