import { NextResponse } from "next/server";
import {
	getInviteeRsvp,
	putInviteeRsvp,
} from "../../../../../lib/invitee/rsvp";
import { rsvpRequestSchema } from "../../../../../validations/invitee-interactions";
import {
	invalidBodyResponse,
	inviteeFailureResponse,
} from "../../_shared/public-response";

type Context = { params: Promise<{ guestToken: string }> };

export async function GET(_request: Request, context: Context) {
	try {
		const { guestToken } = await context.params;
		return NextResponse.json(await getInviteeRsvp(guestToken));
	} catch (error) {
		return inviteeFailureResponse(error);
	}
}

export async function PUT(request: Request, context: Context) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return invalidBodyResponse();
	}
	const input = rsvpRequestSchema.safeParse(body);
	if (!input.success) return invalidBodyResponse();
	try {
		const { guestToken } = await context.params;
		return NextResponse.json(await putInviteeRsvp(guestToken, input.data));
	} catch (error) {
		return inviteeFailureResponse(error);
	}
}
