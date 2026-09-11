import { NextResponse } from "next/server";
import { getInviteeWishes } from "../../../../../lib/invitee/wishes";
import { inviteeFailureResponse } from "../../_shared/public-response";

type Context = { params: Promise<{ guestToken: string }> };

export async function GET(_request: Request, context: Context) {
	try {
		const { guestToken } = await context.params;
		return NextResponse.json(await getInviteeWishes(guestToken));
	} catch (error) {
		return inviteeFailureResponse(error);
	}
}
