import vinextHandler from "vinext/server/fetch-handler";
import {
	logLifecycleResult,
	runInvitationLifecycle,
} from "../lib/lifecycle/invitation-lifecycle";

export async function runScheduledLifecycle() {
	const result = await runInvitationLifecycle({ source: "scheduled" });
	logLifecycleResult(result);
}

export default {
	fetch: vinextHandler.fetch,
	async scheduled() {
		await runScheduledLifecycle();
	},
};
