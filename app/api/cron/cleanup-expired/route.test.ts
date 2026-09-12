import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	authorizeCronRequest: vi.fn(),
	runInvitationLifecycle: vi.fn(),
	logLifecycleResult: vi.fn(),
}));
vi.mock("../../../../lib/lifecycle/cron-authorization", () => ({
	authorizeCronRequest: mocks.authorizeCronRequest,
}));
vi.mock("../../../../lib/lifecycle/invitation-lifecycle", () => ({
	runInvitationLifecycle: mocks.runInvitationLifecycle,
	logLifecycleResult: mocks.logLifecycleResult,
}));

import { POST } from "./route";

describe("cleanup cron route", () => {
	beforeEach(() => vi.clearAllMocks());

	it("rejects unauthorized requests without invoking lifecycle", async () => {
		mocks.authorizeCronRequest.mockResolvedValue(false);
		const response = await POST(
			new Request("https://weplan.test/api/cron/cleanup-expired"),
		);
		expect(response.status).toBe(401);
		expect(mocks.runInvitationLifecycle).not.toHaveBeenCalled();
	});

	it("runs the shared lifecycle with a minimal response", async () => {
		mocks.authorizeCronRequest.mockResolvedValue(true);
		mocks.runInvitationLifecycle.mockResolvedValue({ runId: "run-id" });
		const response = await POST(
			new Request("https://weplan.test/api/cron/cleanup-expired", {
				method: "POST",
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(mocks.runInvitationLifecycle).toHaveBeenCalledWith({
			source: "http-cron",
		});
	});

	it("returns a minimal failure when lifecycle execution fails", async () => {
		mocks.authorizeCronRequest.mockResolvedValue(true);
		mocks.runInvitationLifecycle.mockRejectedValue(new Error("database"));
		const error = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const response = await POST(
			new Request("https://weplan.test/api/cron/cleanup-expired", {
				method: "POST",
			}),
		);
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ ok: false });
		error.mockRestore();
	});
});
