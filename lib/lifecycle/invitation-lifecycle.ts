import "server-only";

import { randomUUID } from "node:crypto";
import {
	type AssetCleanupResult,
	cleanupTrustedInvitationAssets,
} from "../storage/cleanup";
import { createAdminClient } from "../supabase/admin";

export const lifecycleLimits = {
	expiryBatch: 50,
	deletionBatch: 3,
} as const;

export type LifecycleSource = "http-cron" | "scheduled" | "manual";

export type LifecycleCandidate = {
	id: string;
	coupleId: string;
};

export type LifecycleDatabase = {
	findExpiryCandidates(now: string, limit: number): Promise<string[]>;
	expireCandidates(ids: string[], now: string): Promise<number>;
	findDeletionCandidates(
		now: string,
		limit: number,
	): Promise<LifecycleCandidate[]>;
	deleteExpiredCandidate(
		candidate: LifecycleCandidate,
		now: string,
	): Promise<boolean>;
};

export type LifecycleResult = {
	runId: string;
	source: Exclude<LifecycleSource, "manual">;
	expiryCandidates: number;
	expiredCount: number;
	deletionCandidates: number;
	deletedCount: number;
	alreadyAbsentCount: number;
	staleSkippedCount: number;
	incompleteCount: number;
	partialFailureCount: number;
	failureCategories: string[];
	durationMs: number;
};

type InvitationRow = { id: string; couple_id: string };

export function createLifecycleDatabase(): LifecycleDatabase {
	const client = createAdminClient();
	return {
		async findExpiryCandidates(now, limit) {
			const { data, error } = await client
				.from("invitations")
				.select("id")
				.eq("status", "active")
				.not("expires_at", "is", null)
				.lte("expires_at", now)
				.order("expires_at", { ascending: true })
				.order("id", { ascending: true })
				.limit(limit);
			if (error) throw new Error("lifecycle_expiry_selection_failed");
			return (data ?? []).map((row) => row.id);
		},
		async expireCandidates(ids, now) {
			if (ids.length === 0) return 0;
			const { data, error } = await client
				.from("invitations")
				.update({ status: "expired" })
				.in("id", ids)
				.eq("status", "active")
				.not("expires_at", "is", null)
				.lte("expires_at", now)
				.select("id");
			if (error) throw new Error("lifecycle_expiry_update_failed");
			return data?.length ?? 0;
		},
		async findDeletionCandidates(now, limit) {
			const { data, error } = await client
				.from("invitations")
				.select("id,couple_id")
				.eq("status", "expired")
				.not("delete_after", "is", null)
				.lte("delete_after", now)
				.order("delete_after", { ascending: true })
				.order("id", { ascending: true })
				.limit(limit);
			if (error) throw new Error("lifecycle_deletion_selection_failed");
			return ((data ?? []) as InvitationRow[]).map((row) => ({
				id: row.id,
				coupleId: row.couple_id,
			}));
		},
		async deleteExpiredCandidate(candidate, now) {
			const { data, error } = await client
				.from("invitations")
				.delete()
				.eq("id", candidate.id)
				.eq("couple_id", candidate.coupleId)
				.eq("status", "expired")
				.not("delete_after", "is", null)
				.lte("delete_after", now)
				.select("id")
				.maybeSingle();
			if (error) throw new Error("lifecycle_database_delete_failed");
			return Boolean(data);
		},
	};
}

type Cleanup = (
	coupleId: string,
	invitationId: string,
) => Promise<AssetCleanupResult>;

export async function cleanupThenDeleteInvitation(
	candidate: LifecycleCandidate,
	deleteInvitation: () => Promise<boolean>,
	cleanup: Cleanup = cleanupTrustedInvitationAssets,
) {
	let cleanupResult: AssetCleanupResult;
	try {
		cleanupResult = await cleanup(candidate.coupleId, candidate.id);
	} catch {
		return "storage-failed" as const;
	}
	if (cleanupResult.outcome === "partial-failure")
		return "storage-failed" as const;
	if (cleanupResult.outcome === "incomplete")
		return "storage-incomplete" as const;
	try {
		if (!(await deleteInvitation())) return "stale" as const;
		return cleanupResult.outcome === "already-absent"
			? ("deleted-after-absent" as const)
			: ("deleted" as const);
	} catch {
		return "database-failed" as const;
	}
}

export async function runInvitationLifecycle(options: {
	source: Exclude<LifecycleSource, "manual">;
	database?: LifecycleDatabase;
	cleanup?: Cleanup;
	now?: Date;
}): Promise<LifecycleResult> {
	const started = Date.now();
	const now = (options.now ?? new Date()).toISOString();
	const database = options.database ?? createLifecycleDatabase();
	const expiryIds = await database.findExpiryCandidates(
		now,
		lifecycleLimits.expiryBatch,
	);
	const expiredCount = await database.expireCandidates(expiryIds, now);
	const candidates = await database.findDeletionCandidates(
		now,
		lifecycleLimits.deletionBatch,
	);
	const result: LifecycleResult = {
		runId: randomUUID(),
		source: options.source,
		expiryCandidates: expiryIds.length,
		expiredCount,
		deletionCandidates: candidates.length,
		deletedCount: 0,
		alreadyAbsentCount: 0,
		staleSkippedCount: 0,
		incompleteCount: 0,
		partialFailureCount: 0,
		failureCategories: [],
		durationMs: 0,
	};
	for (const candidate of candidates) {
		const outcome = await cleanupThenDeleteInvitation(
			candidate,
			() => database.deleteExpiredCandidate(candidate, now),
			options.cleanup,
		);
		if (outcome === "deleted") result.deletedCount += 1;
		else if (outcome === "deleted-after-absent") {
			result.deletedCount += 1;
			result.alreadyAbsentCount += 1;
		} else if (outcome === "stale") result.staleSkippedCount += 1;
		else if (outcome === "storage-incomplete") result.incompleteCount += 1;
		else {
			result.partialFailureCount += 1;
			result.failureCategories.push(outcome);
		}
	}
	result.failureCategories = [...new Set(result.failureCategories)];
	result.durationMs = Date.now() - started;
	return result;
}

export function logLifecycleResult(result: LifecycleResult) {
	console.info(JSON.stringify({ event: "invitation_lifecycle", ...result }));
}
