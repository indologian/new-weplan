import { NextResponse } from "next/server";
import { putInviteeWish } from "../../../../../lib/invitee/wishes";
import { wishRequestSchema } from "../../../../../validations/invitee-interactions";
import {
	invalidBodyResponse,
	inviteeFailureResponse,
} from "../../_shared/public-response";

type Context = { params: Promise<{ guestToken: string }> };

export async function PUT(request: Request, context: Context) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return invalidBodyResponse();
	}
	const input = wishRequestSchema.safeParse(body);
	if (!input.success) return invalidBodyResponse();
	try {
		const { guestToken } = await context.params;
		return NextResponse.json(await putInviteeWish(guestToken, input.data));
	} catch (error) {
		return inviteeFailureResponse(error);
	}
}
