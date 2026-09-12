import { z } from "zod";
import { requireAuthenticatedMutation } from "../../lib/auth/authorization";
import { cleanupThenDeleteInvitation } from "../../lib/lifecycle/invitation-lifecycle";

const permanentDeleteSchema = z.strictObject({
	invitationId: z.string().uuid(),
	intent: z.literal("PERMANENT_DELETE"),
});

export async function permanentlyDeleteInvitationService(input: unknown) {
	const parsed = permanentDeleteSchema.safeParse(input);
	if (!parsed.success)
		throw new Error("Konfirmasi hapus permanen tidak valid.");
	const { supabase, userId } = await requireAuthenticatedMutation();
	const { data: invitation, error } = await supabase
		.from("invitations")
		.select("id,couple_id")
		.eq("id", parsed.data.invitationId)
		.eq("couple_id", userId)
		.maybeSingle();
	if (error || !invitation)
		throw new Error("Tidak memiliki akses ke undangan ini.");

	const candidate = { id: invitation.id, coupleId: invitation.couple_id };
	const outcome = await cleanupThenDeleteInvitation(candidate, async () => {
		const { data, error: deleteError } = await supabase
			.from("invitations")
			.delete()
			.eq("id", candidate.id)
			.eq("couple_id", userId)
			.select("id")
			.maybeSingle();
		if (deleteError) throw new Error("Gagal menghapus undangan.");
		return Boolean(data);
	});

	if (outcome === "storage-incomplete" || outcome === "storage-failed") {
		throw new Error(
			"Asset undangan belum seluruhnya terhapus. Silakan coba lagi.",
		);
	}
	if (outcome === "database-failed")
		throw new Error("Gagal menghapus undangan.");
	return {
		deleted: outcome === "deleted" || outcome === "deleted-after-absent",
		outcome,
	};
}
