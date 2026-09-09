import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const slug = searchParams.get("slug");

	if (!slug || slug.length < 3) {
		return NextResponse.json({ available: false }, { status: 400 });
	}

	const supabase = await createClient();
	const { error } = await supabase
		.from("invitations")
		.select("id")
		.eq("slug", slug)
		.single();

	if (error && error.code === "PGRST116") {
		// PGRST116 means zero rows returned from .single(), so slug is available.
		return NextResponse.json({ slug, available: true });
	}

	return NextResponse.json({ slug, available: false });
}
