import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuthenticatedMutation: vi.fn() }));
vi.mock("../../lib/auth/authorization", () => ({
	requireAuthenticatedMutation: mocks.requireAuthenticatedMutation,
}));

import {
	getInteractionConfig,
	updateInteractionConfig,
} from "./interaction-config";
import { InteractionConfigTestDatabase } from "./interaction-config-test-support";

const ownerId = "00000000-0000-4000-8000-000000000010";
const otherOwnerId = "00000000-0000-4000-8000-000000000020";
const invitationId = "00000000-0000-4000-8000-000000000100";
const otherInvitationId = "00000000-0000-4000-8000-000000000200";

describe("interaction config actions", () => {
	let database: InteractionConfigTestDatabase;

	beforeEach(() => {
		database = new InteractionConfigTestDatabase(
			ownerId,
			invitationId,
			otherOwnerId,
			otherInvitationId,
		);
		mocks.requireAuthenticatedMutation.mockResolvedValue({
			supabase: database.client,
			userId: ownerId,
		});
	});

	it("loads current persisted values for the owner", async () => {
		await expect(getInteractionConfig(invitationId)).resolves.toEqual({
			rsvpEnabled: true,
			wishesEnabled: true,
		});
	});

	it("rejects unauthenticated reads and updates", async () => {
		mocks.requireAuthenticatedMutation.mockRejectedValue(new Error("Login"));
		await expect(getInteractionConfig(invitationId)).rejects.toThrow("Login");
		await expect(
			updateInteractionConfig(invitationId, {
				rsvpEnabled: true,
				wishesEnabled: false,
			}),
		).rejects.toThrow("Login");
	});

	it("rejects cross-owner reads and updates", async () => {
		await expect(getInteractionConfig(otherInvitationId)).rejects.toThrow(
			"Tidak memiliki akses",
		);
		await expect(
			updateInteractionConfig(otherInvitationId, {
				rsvpEnabled: true,
				wishesEnabled: true,
			}),
		).rejects.toThrow("Tidak memiliki akses");
	});

	it.each([
		{ rsvpEnabled: true, wishesEnabled: true },
		{ rsvpEnabled: true, wishesEnabled: false },
		{ rsvpEnabled: false, wishesEnabled: true },
		{ rsvpEnabled: false, wishesEnabled: false },
	])(
		"persists and reloads independent combination $rsvpEnabled/$wishesEnabled",
		async (config) => {
			await expect(
				updateInteractionConfig(invitationId, config),
			).resolves.toEqual(config);
			await expect(getInteractionConfig(invitationId)).resolves.toEqual(config);
		},
	);

	it("updates only the two approved persistence fields", async () => {
		await updateInteractionConfig(invitationId, {
			rsvpEnabled: false,
			wishesEnabled: true,
			coupleId: otherOwnerId,
			slug: "changed",
			status: "published",
			themeId: "changed",
			tierId: "changed",
		});
		expect(database.updatePayloads).toEqual([
			{ rsvp_enabled: false, wishes_enabled: true },
		]);
		expect(database.invitations[0]).toMatchObject({
			couple_id: ownerId,
			slug: "owner-invitation",
			status: "draft",
		});
	});

	it("rejects non-boolean mutation input", async () => {
		await expect(
			updateInteractionConfig(invitationId, {
				rsvpEnabled: "false",
				wishesEnabled: true,
			}),
		).rejects.toThrow("tidak valid");
		expect(database.updatePayloads).toEqual([]);
	});
});
