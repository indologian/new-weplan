import "server-only";

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "./schemas";

function displayNameForUser(user: User): string {
	const metadataName = user.user_metadata.full_name;
	const parsedName = registerSchema.shape.fullName.safeParse(metadataName);

	if (parsedName.success) {
		return parsedName.data;
	}

	return user.email?.split("@")[0] || "Pengguna";
}

export async function ensureCoupleProfile(
	user: User,
	fullName = displayNameForUser(user),
): Promise<void> {
	const admin = createAdminClient();
	const { error } = await admin.from("profiles").upsert(
		{
			id: user.id,
			full_name: fullName,
			role: "couple",
		},
		{
			ignoreDuplicates: true,
			onConflict: "id",
		},
	);

	if (error) {
		throw new Error("Profil pengguna tidak dapat dibuat.", { cause: error });
	}
}
