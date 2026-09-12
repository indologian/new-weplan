import { authorizeCronRequest } from "../../../../lib/lifecycle/cron-authorization";
import {
	logLifecycleResult,
	runInvitationLifecycle,
} from "../../../../lib/lifecycle/invitation-lifecycle";

export async function POST(request: Request) {
	const authorized = await authorizeCronRequest(
		request.headers.get("authorization"),
		process.env.CRON_SECRET,
	);
	if (!authorized) return Response.json({ ok: false }, { status: 401 });
	try {
		const result = await runInvitationLifecycle({ source: "http-cron" });
		logLifecycleResult(result);
		return Response.json({ ok: true });
	} catch (error) {
		console.error(
			JSON.stringify({
				event: "invitation_lifecycle_failed",
				source: "http-cron",
				category: error instanceof Error ? error.message : "unknown",
			}),
		);
		return Response.json({ ok: false }, { status: 500 });
	}
}
