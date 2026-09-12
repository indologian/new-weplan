# Task 19 — Lifecycle & Deployment

## Goal

Implement invitation expiry/grace-period cleanup, reusable idempotent deletion lifecycle, Cloudflare Workers deployment compatibility, scheduled cleanup execution, and zero-fixed-cost operational logging.

## Depends On

18

## Required Context

- `docs/architecture/deployment/CLOUDFLARE-SUPABASE.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/PAYMENT.md`
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/backup/BACKUP-RESTORE.md`
- `docs/architecture/database/schema.sql` — read-only, only lifecycle-related definitions for:
  - `invitations`
  - `transactions`

- official current Cloudflare documentation for:
  - Next.js on Workers
  - vinext compatibility/migration
  - Cron Triggers
  - scheduled handlers
  - Workers Free limits

Do not read unrelated reference documents or unrelated database tables.

## Allowed Paths

- `app/api/cron/**`
- `lib/lifecycle/**`
- `lib/storage/**`
- `actions/invitations/**` only if required for approved manual-delete reuse
- `wrangler.*`
- `vite.config.*`
- Cloudflare/vinext worker-entry/config files generated or required by the approved deployment path
- `package.json`
- lockfile only when Cloudflare/vinext initialization legitimately changes dependencies
- `docs/architecture/deployment/**`
- `docs/architecture/backup/**` only if Task 19 verification reveals deployment/restore SOP updates are required
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, payment state semantics, public invitation authorization rules, RSVP/Wishes behavior, admin/couple feature logic, schema/RLS unless a proven lifecycle requirement explicitly requires approval, or future Task 20 production-hardening work.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

# Lifecycle Contract

Invitation lifecycle remains:

`draft`
→ `payment_pending`
→ `active`
→ `expired`
→ hard deletion after grace

Task 19 must not change Task 17 payment semantics.

## Expiry

An invitation becomes publicly unavailable at:

`expires_at`

Cron/lifecycle worker must mark:

`status = expired`

when:

- current status is `active`;
- `expires_at IS NOT NULL`;
- `expires_at <= now()`.

Do not wait for `delete_after` to disable public access.

Task 15/16 already reject time-expired invitations independently; Task 19 synchronizes persisted status.

## Grace Period

`delete_after` was calculated by Task 17 as:

`expires_at + 7 days`

During grace:

- invitation remains `expired`;
- public invitation remains unavailable;
- persisted invitation data/assets remain retained for recovery/operations;
- no automatic reactivation.

Task 19 must not recalculate paid lifecycle dates from current tier.

## Hard Delete Eligibility

Invitation is eligible for automatic hard deletion only when:

- `status = expired`;
- `delete_after IS NOT NULL`;
- `delete_after <= now()`.

Do not hard-delete:

- draft
- payment_pending
- active
- expired still inside grace period

## Transaction History

Transactions must survive invitation deletion.

Existing contract:

`transactions.invitation_id`
→ nullable FK
→ `ON DELETE SET NULL`

Task 19 must verify this behavior with tests.

Do not delete transaction rows during invitation cleanup.

Historical commercial snapshots remain immutable.

# Cleanup Ordering

Hard deletion flow must follow:

1. identify trusted deletion candidate;
2. clean all canonical invitation Storage assets;
3. verify Storage cleanup result;
4. only if Storage cleanup is complete/safely absent:
   delete invitation database row;
5. rely on existing cascade behavior for invitation child tables;
6. verify transaction history survives with nullable invitation relation.

Do NOT:

`delete DB invitation → attempt Storage cleanup later`

because that can orphan private objects and remove the ownership context required for safe cleanup.

# Shared Cleanup Service

Reuse Task 13 cleanup primitives.

Create a higher-level lifecycle cleanup service under:

`lib/lifecycle/**`

that coordinates:

- lifecycle authorization/trusted candidate;
- Storage cleanup;
- database deletion;
- structured result.

Do not create a second Storage cleanup implementation.

Storage details remain delegated to Task 13 primitives.

## Idempotency

Cleanup must be safe to retry.

Examples:

### Already Expired

Running expiry sync twice:

- first call marks active → expired;
- second call is safe no-op.

### Missing Storage Object

Missing canonical object is treated as already absent.

### Partial Storage Failure

If one or more objects fail cleanup:

- invitation database row must remain;
- result records failure;
- next cron run can retry.

### Invitation Already Deleted

Trusted cleanup retry should produce a controlled already-absent/no-op result.

Do not treat expected retries as fatal corruption.

## Database Delete Failure

If Storage cleanup succeeded but database deletion fails:

- report structured failure;
- next retry must remain safe;
- Storage already absent must not prevent retrying DB deletion.

# Manual Delete Reuse

Architecture already permits couple manual permanent deletion, including active invitations.

Task 19 should provide/reuse the same high-level cleanup orchestration for manual deletion if the existing application has the required integration boundary.

Manual delete contract:

authenticate couple
→ verify invitation ownership
→ explicit permanent-delete intent
→ cleanup Storage
→ hard-delete invitation
→ preserve transactions

No refund is triggered automatically.

Manual deletion must not:

- change transaction payment status;
- invoke Midtrans refund;
- delete transaction history.

If wiring the existing Couple Dashboard delete UI requires write paths outside approved Task 19 scope, report BLOCKER rather than duplicating dashboard logic.

# Cron Processing

Task 19 must process lifecycle work in bounded batches.

Do not fetch/process an unlimited number of invitations in one scheduled execution.

Suggested behavior:

1. process bounded active-expiry batch;
2. process bounded delete-ready expired batch;
3. stop after configured maximum work;
4. remaining backlog waits for next run.

Batch size must be chosen during Planning Gate using current Cloudflare/Supabase constraints and actual cleanup implementation.

Do not hardcode a very large batch merely to clear all backlog.

## Concurrency

Multiple cron/manual invocations may overlap.

Lifecycle processing must tolerate:

- cron retry;
- manual delete concurrent with cron;
- repeated scheduled invocation;
- multiple Worker instances.

Do not depend on in-memory lock.

If safe database coordination requires a narrow RPC/advisory lock or other database change, report it during Planning Gate before implementation.

# Cron Schedule

Use Cloudflare Workers Cron Trigger.

Cron expressions execute in UTC.

Use one daily lifecycle trigger for MVP unless verified backlog/performance requires another cadence.

The exact UTC cron expression must be documented alongside its intended Asia/Jakarta operational time.

Do not add more triggers without need.

# Cloudflare Scheduled Handler

Prefer the native Cloudflare Workers `scheduled()` handler for the Cron Trigger.

The scheduled handler should invoke the same lifecycle service used by other trusted server entry points.

Do not duplicate lifecycle logic inside the Worker handler.

Scheduled handler outcome should propagate success/failure appropriately so Cloudflare Cron Past Events records meaningful status.

If vinext requires a custom Worker entrypoint to compose Next.js fetch handling with `scheduled()`, Planning Gate must identify the exact supported current integration and required file path before coding.

Do not invent a Worker entry format from memory.

# Internal Cron HTTP Endpoint

An internal endpoint may also exist:

`POST /api/cron/cleanup-expired`

for controlled operational/manual invocation and testing.

If implemented:

- require `Authorization: Bearer <CRON_SECRET>`;
- compare secret safely;
- fail closed if `CRON_SECRET` missing;
- do not expose cleanup operation publicly;
- use the same lifecycle service as scheduled handler.

The HTTP endpoint is not a substitute for native Cron authorization when the Worker scheduled handler can invoke the lifecycle service directly.

Never put `CRON_SECRET` in `NEXT_PUBLIC_*`.

# Lifecycle Service Database Access

Cron/scheduled cleanup has no authenticated couple session.

Use the existing server-only privileged Supabase boundary only inside trusted lifecycle server code.

Never expose privileged credentials to browser code.

Queries must be narrow:

- expiry candidates;
- delete-ready candidates;
- exact invitation being deleted.

Do not create a generic privileged database service.

# Operational Logging

Use structured server/Worker logs only.

Log safe operational facts such as:

- job type
- run identifier
- candidate counts
- expired count
- deleted count
- retry/partial-failure count
- invitation internal ID only when operationally necessary
- high-level failure category

Do not log:

- Supabase secret/service credentials
- CRON_SECRET
- Midtrans keys
- guest token/hash/ciphertext
- signed Storage URLs
- full personalized invitation URLs
- private object signed query parameters

Task 19 does not require paid external observability.

Cloudflare-native logs are the initial zero-fixed-cost strategy.

# Deployment Target

Target:

Cloudflare Workers

for the full-stack Weplan application.

Per current Cloudflare guidance, Planning Gate must evaluate **vinext** first for this existing Next.js application.

Required pre-migration step:

`npx vinext check`

Review all compatibility findings before initializing migration.

Do not run `vinext init` until compatibility findings have been presented and judged acceptable.

If compatibility check identifies a blocking unsupported feature:

- evaluate existing OpenNext path as fallback;
- do not silently force vinext.

OpenNext is fallback only when a verified vinext compatibility gap prevents deployment.

# Vinext Migration Boundary

If compatibility check passes sufficiently:

use the current supported vinext initialization/migration workflow.

Expected generated/updated configuration may include:

- `vite.config.*`
- Wrangler configuration
- Cloudflare-specific package scripts/dependencies

Preserve ordinary Next.js development/build flow where vinext supports side-by-side operation.

Do not remove working Next.js scripts unnecessarily.

Do not perform repository-wide refactors unrelated to Cloudflare compatibility.

# Cloudflare Free-Tier Constraint

Deployment must remain compatible with Workers Free as the MVP target.

Planning/validation must account for current free limits, including:

- request limits;
- CPU limits;
- Cron Trigger limits;
- subrequest limits.

Lifecycle cleanup must therefore remain bounded and network-I/O-oriented.

Do not introduce a paid Cloudflare product as a mandatory dependency.

# Environment / Secrets

Deployment documentation must identify without values:

Public/browser-safe:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `NEXT_PUBLIC_APP_URL`

Server-only:

- `SUPABASE_SECRET_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `INVITEE_TOKEN_ENCRYPTION_KEY`
- `CRON_SECRET`

Do not commit actual values.

If vinext/Cloudflare requires a different secret-injection mechanism, document it without putting values into Wrangler config.

# Deployment Compatibility

Task 19 must verify that the existing application remains compatible with Cloudflare Workers for at least:

- App Router
- Server Components
- Server Actions
- Route Handlers
- Supabase HTTP-based clients
- Midtrans native fetch calls
- Web Crypto / crypto usage used by invitee token implementation
- private signed Storage flows
- webhook route
- public personalized invitation routes

Any Node-only runtime use discovered during compatibility check must be reviewed.

Do not replace working security-sensitive crypto code casually merely to make deployment pass.

# Backup / Migration Safety

Before any new production database migration/deployment procedure:

follow `BACKUP-RESTORE.md`.

Task 19 must not claim Supabase Free includes paid PITR capabilities that are not available.

Deployment documentation should include a pre-production checklist:

- migrations already validated in dedicated development;
- backup procedure understood/executed as appropriate;
- environment/secrets configured;
- Midtrans Notification URL configured;
- cron trigger configured;
- smoke tests ready.

# Smoke Tests

Deployment compatibility/smoke testing must cover at minimum:

- Home loads
- email/password auth route
- Google OAuth callback compatibility/config review
- Couple Dashboard protected route
- Admin Dashboard authorization
- builder/review route
- public invitation valid/invalid behavior
- RSVP/Wishes API
- payment checkout endpoint behavior in sandbox/test mode
- Midtrans webhook endpoint reachable
- cron endpoint authorization
- scheduled handler local/test invocation when supported
- private signed Storage asset flow
- no exposed secrets in client bundle/config

Do not perform a real production payment merely for Task 19 smoke validation.

# Acceptance Criteria

- Active invitations become expired at/after `expires_at`.
- Public invitation remains unavailable after expiration.
- Grace period lasts until persisted `delete_after`.
- Delete-ready expired invitations clean Storage before DB hard delete.
- Transactions survive invitation hard deletion.
- Cleanup is idempotent.
- Partial Storage cleanup is retryable.
- Database deletion failure is retryable.
- Overlapping cleanup invocations do not corrupt lifecycle state.
- Manual deletion can reuse the same cleanup service where integration is in approved scope.
- Cron work is bounded.
- Cron authorization is secure.
- No secrets are logged.
- Cloudflare deployment compatibility is verified.
- vinext compatibility is explicitly checked before migration.
- Existing Next.js behavior remains validated.
- Cloudflare Workers Free remains viable for MVP.
- Smoke tests pass.
- Task 19 does not change payment semantics from Task 17.

# Required Validation

## Lifecycle

- active before expiry remains active
- active at/past expiry becomes expired
- repeated expiry processing is idempotent
- draft/payment_pending unaffected
- grace-period expired row retained
- delete-ready detection
- Storage cleanup occurs before DB deletion
- successful cleanup + hard delete
- transaction survives with `invitation_id = null`
- missing Storage object idempotency
- partial Storage failure retains invitation
- DB delete failure retry
- repeated cleanup after prior Storage success
- concurrent/repeated cleanup safety

## Manual Delete

If implemented in Task 19:

- unauthenticated rejection
- cross-owner rejection
- active invitation may be deleted only through explicit permanent delete action
- Storage cleanup before DB delete
- transaction survives
- no refund/payment mutation

## Cron

- missing/invalid CRON_SECRET rejected for HTTP endpoint
- valid CRON_SECRET accepted
- bounded batch behavior
- scheduled handler calls shared lifecycle service
- repeated scheduled run safe
- no secret logging

## Deployment

- `vinext check`
- compatibility findings reviewed
- vinext initialization only after compatibility approval
- vinext build
- existing Next.js build/regressions
- Cloudflare Workers configuration validation
- Wrangler config validation
- Cron Trigger configuration validation
- local scheduled-handler test when supported
- Worker bundle/client secret scan
- production-mode configuration review without exposing secrets

## Regression / Scope

- Task 17 payment/lifecycle timestamps unchanged
- Task 15/16 expiry access behavior unchanged
- Task 13 cleanup primitives regression
- transaction history preserved
- no payment refund/renewal
- no unrelated schema/RLS changes

## Final Validation

- focused Task 19 tests
- lifecycle/security negative tests
- relevant Task 13/15/16/17 regressions
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for Task 19 files
- existing Next.js production build
- vinext compatibility/build validation
- Cloudflare scheduled-handler validation
- scoped `git diff --check`
- actual Allowed Paths review
- credential/secret scan
- dependency review
- schema/RLS/migration review
- staged-file review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 19 implementation, approved deployment configuration/dependencies, documentation updates, and completion records.

Then STOP. Do not begin Task 20.
