import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { invitationSlugSchema } from "../../../../validations/invitation";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const parsedSlug = invitationSlugSchema.safeParse(searchParams.get("slug"));

	if (!parsedSlug.success) {
		return NextResponse.json(
			{ slug: searchParams.get("slug") ?? "", available: false },
			{ status: 400 },
		);
	}

	const slug = parsedSlug.data;
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("invitations")
		.select("slug")
		.eq("slug", slug)
		.limit(1)
		.maybeSingle();

	if (error) {
		return NextResponse.json({ slug, available: false }, { status: 503 });
	}

	return NextResponse.json({ slug, available: data === null });
}
