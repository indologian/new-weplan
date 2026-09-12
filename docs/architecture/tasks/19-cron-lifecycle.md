# Task 19 — Lifecycle & Deployment

## Goal

Implement invitation expiry/grace-period cleanup, reusable idempotent deletion lifecycle, Cloudflare Workers deployment compatibility, scheduled cleanup execution, operational logging, and validated vinext deployment configuration.

## Depends On

18

## Required Context

* `docs/architecture/deployment/CLOUDFLARE-SUPABASE.md`
* `docs/architecture/reference/STORAGE.md`
* `docs/architecture/reference/PAYMENT.md`
* `docs/architecture/reference/DATABASE.md`
* `docs/architecture/reference/SECURITY.md`
* `docs/architecture/backup/BACKUP-RESTORE.md`
* `docs/architecture/database/schema.sql` — read-only, only lifecycle-related definitions for:

  * `invitations`
  * `transactions`

Also verify current official Cloudflare/vinext documentation for:

* Next.js on Cloudflare Workers
* current vinext compatibility/status
* `vinext check`
* `vinext init`
* custom Worker entrypoints
* Cron Triggers
* `scheduled()` handlers
* local scheduled-event testing
* Workers Free limits
* secrets/environment bindings

Do not read unrelated reference documents or unrelated database tables.

---

## Allowed Paths

* `app/api/cron/**`
* `lib/lifecycle/**`
* `lib/storage/**`
* `actions/invitations/**` only for approved manual-delete server-action reuse
* `worker/**`
* `wrangler.*`
* `vite.config.*`
* `package.json`
* `package-lock.json`
* `.gitignore`
* Cloudflare/vinext generated entry/config files required by the approved deployment path
* `docs/architecture/deployment/**`
* `docs/architecture/backup/**` only if verification requires an SOP update
* `docs/architecture/agent/PROJECT-STATE.md`
* `docs/architecture/agent/HANDOFF.md`

### `.gitignore` Scope

Task 19 may add only these generated-artifact entries:

```gitignore
/dist/
.vinext/
.wrangler/
```

Do not modify unrelated `.gitignore` entries.

If vinext generates another required ignore entry, STOP and record a BLOCKER before accepting it.

---

## Do Not Touch

Any unrelated feature, future task, payment state semantics, public invitation authorization behavior, RSVP/Wishes behavior, Admin Dashboard behavior, Couple Dashboard UI, schema/RLS unless separately approved, or Task 20 behavior.

Specifically:

* do not modify `features/couple-dashboard/**`;
* do not add manual-delete UI;
* do not alter Task 17 payment semantics;
* do not implement refund/renewal;
* do not alter transaction history;
* do not modify `.env*`;
* do not modify `CURRENT-TASK.md`.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

---

# Lifecycle Contract

Invitation lifecycle remains:

```text
draft
→ payment_pending
→ active
→ expired
→ hard deletion after grace
```

Task 19 must not redefine Task 17 payment/lifecycle semantics.

---

## Expiry

An invitation becomes expired when:

```text
status = active
AND expires_at IS NOT NULL
AND expires_at <= now()
```

Transition:

```text
active → expired
```

The mutation must remain conditional on the same persisted eligibility state so stale/repeated processing becomes a safe no-op.

Task 19 must not modify:

* `paid_at`
* `published_at`
* `expires_at`
* `delete_after`
* transaction status
* transaction snapshots

Task 15/16 expiration enforcement remains unchanged.

---

## Grace Period

`delete_after` is authoritative and was established by the existing payment lifecycle.

During grace:

```text
status = expired
AND delete_after > now()
```

the invitation:

* remains unavailable publicly;
* remains persisted;
* retains private assets;
* is not automatically reactivated;
* is not yet eligible for hard deletion.

Do not recalculate `delete_after` from current tier configuration.

---

## Hard Delete Eligibility

Automatic hard deletion is allowed only when:

```text
status = expired
AND delete_after IS NOT NULL
AND delete_after <= now()
```

Never automatically hard-delete:

* `draft`
* `payment_pending`
* `active`
* expired invitations still inside grace

---

# Storage-Before-Database Deletion

Deletion order is mandatory:

```text
trusted candidate
→ canonical Storage cleanup
→ verify cleanup complete/already absent
→ conditional invitation DB delete
→ verify transaction history survives
```

Never use:

```text
DB delete
→ Storage cleanup
```

because this can orphan private Storage objects and remove trusted ownership context.

---

## Task 13 Cleanup Reuse

Reuse Task 13 Storage primitives.

Do not create a second invitation Storage cleanup implementation.

Task 19 may make narrowly scoped changes in `lib/storage/**` only when required for:

* bounded traversal;
* explicit traversal budget;
* incomplete-result signaling;
* partial failure reporting;
* retry-safe lifecycle orchestration.

Existing Gallery, Music, preview, and Task 13 behavior must remain compatible.

---

## Cleanup Idempotency

Cleanup must be safe to retry.

### Already Expired

Repeated expiry processing:

```text
first run → active → expired
later run → safe no-op
```

### Missing Storage Object

Missing canonical Storage objects are treated as already absent.

### Partial Storage Failure

If any required Storage cleanup remains incomplete:

```text
retain invitation DB row
→ report controlled incomplete/partial result
→ retry next run
```

### Storage Complete, DB Delete Failure

If Storage cleanup succeeds but database deletion fails:

```text
next run
→ Storage already absent is acceptable
→ retry conditional DB deletion
```

### Invitation Already Deleted

A repeated trusted cleanup must return controlled already-absent/no-op behavior.

---

# Transaction Preservation

Transactions must survive invitation hard deletion.

Verify existing contract:

```text
transactions.invitation_id
→ nullable
→ ON DELETE SET NULL
```

Task 19 must never delete transaction history.

After invitation deletion, verify that the transaction retains:

* Midtrans/order identifier;
* status;
* `paid_at`;
* theme snapshot;
* tier snapshot;
* price snapshot;
* duration snapshot;
* other historical payment fields.

Only:

```text
transactions.invitation_id
```

may become `NULL` through the existing FK behavior.

Task 18 historical revenue must remain correct after invitation deletion.

---

# Concurrency

Task 19 must tolerate overlapping:

* cron vs cron;
* cron vs manual delete;
* repeated scheduled runs;
* stale candidate selection;
* Storage cleanup completed by another invocation;
* DB deletion completed by another invocation.

Do not use in-memory locking.

Use:

* conditional DB predicates;
* idempotent Storage cleanup;
* controlled already-absent results.

No advisory lock, lifecycle RPC, or migration is approved by default.

If implementation evidence shows correctness cannot be guaranteed without additional database coordination:

`BLOCKER`

and STOP.

---

# Bounded Processing

Cron processing must be bounded.

Initial safety caps:

```text
expiry batch       = 50 invitations
delete batch       = 3 invitations
Storage list budget = max 8 list requests / invitation / run
bulk remove         = max 1000 discovered paths / request
```

These are safety caps, not guaranteed production throughput.

Implement them as named internal constants/configuration that can be reduced easily.

Ordering must be deterministic:

```text
expiry:
expires_at ASC, id ASC

deletion:
delete_after ASC, id ASC
```

If traversal budget is exhausted:

* discovered safe objects may be cleaned;
* cleanup result is marked incomplete;
* invitation DB row remains;
* next run continues retry behavior.

Do not increase these caps without approval.

If Workers Free runtime evidence requires smaller caps, reduce them.

---

# Manual Permanent Delete

Task 19 may implement the reusable server-action boundary only.

Allowed location:

```text
actions/invitations/**
```

Do not mount manual-delete UI in Couple Dashboard during Task 19.

Contract:

```text
authenticate couple
→ validate invitation
→ verify ownership
→ verify explicit permanent-delete intent
→ shared lifecycle cleanup service
→ Storage-first cleanup
→ DB hard delete
→ transaction history preserved
```

Manual deletion must not:

* refund;
* invoke Midtrans refund;
* modify transaction status;
* delete transaction history;
* rewrite lifecycle/payment snapshots.

Cross-owner and unauthenticated requests must fail before privileged cleanup.

UI integration is explicitly outside Task 19.

---

# Privileged Lifecycle Boundary

Cron has no couple session.

Trusted lifecycle chain:

```text
native scheduled Worker
or
authorized cron HTTP endpoint

→ shared lib/lifecycle service
→ existing server-only privileged Supabase boundary
```

Privileged access may only be used for narrowly scoped lifecycle operations:

* candidate selection;
* conditional expiry;
* trusted Storage cleanup;
* conditional invitation deletion.

Do not create a generic privileged CRUD helper.

Never expose privileged credentials/client to browser code.

---

# Cron Schedule

Use one daily Cloudflare Cron Trigger for MVP:

```cron
0 19 * * *
```

Equivalent:

```text
19:00 UTC
02:00 Asia/Jakarta on the following day
```

Cron expressions are interpreted in UTC.

Do not add additional triggers without evidence and approval.

---

# Native Scheduled Handler

Use the current supported vinext/Cloudflare custom Worker pattern.

Planned Worker entry:

```text
worker/index.ts
```

The Worker must preserve normal application `fetch()` handling and add:

```text
scheduled()
```

The scheduled handler must call the same shared lifecycle service used by other trusted lifecycle entrypoints.

Do not duplicate lifecycle logic in the Worker.

Cron failure must not be silently swallowed.

Await/propagate execution sufficiently for Cloudflare Cron Past Events to reflect meaningful failure state.

---

# HTTP Cron Endpoint

Implement:

```text
POST /api/cron/cleanup-expired
```

Purpose:

* controlled operational invocation;
* integration testing;
* troubleshooting fallback.

It is not a substitute for the native scheduled trigger.

Authorization:

```text
Authorization: Bearer <CRON_SECRET>
```

Requirements:

* missing `CRON_SECRET` → fail closed;
* missing Authorization → reject;
* invalid Authorization → reject;
* POST only;
* safe secret comparison;
* shared lifecycle service;
* minimal response;
* no sensitive internal failure details.

Never expose `CRON_SECRET` through `NEXT_PUBLIC_*`.

---

# Operational Logging

Use structured operational logs.

Approved fields may include:

```text
runId
source
expiryCandidates
expiredCount
deletionCandidates
deletedCount
alreadyAbsentCount
staleSkippedCount
incompleteCount
partialFailureCount
failureCategories
durationMs
```

Do not log:

* Supabase credentials;
* `CRON_SECRET`;
* Midtrans keys;
* guest tokens;
* guest token hashes;
* guest token ciphertext;
* Authorization headers;
* signed Storage URLs;
* signed query parameters;
* personalized invitation URLs.

Do not introduce a mandatory paid observability service.

Cloudflare-native logs are sufficient for MVP.

---

# Cloudflare Deployment Target

Target:

```text
Cloudflare Workers
```

Use current Cloudflare guidance.

For this existing Next.js application, evaluate/use vinext only after compatibility validation.

---

# Vinext Compatibility Gate

Before migration:

```bash
npx vinext check
```

must succeed sufficiently for implementation approval.

Current approved Planning Gate baseline:

```text
vinext: 1.0.0-beta.9
overall compatibility: 92%
blocking unsupported application feature: none reported
```

Known findings include:

* `"type": "module"` required;
* `reactStrictMode` warning;
* runtime validation still required for crypto, environment access, Supabase, Midtrans, Server Actions, Route Handlers, and signed Storage flows.

Vinext remains beta.

Do not claim Cloudflare compatibility solely from `vinext check`.

---

# Vinext Initialization

`vinext init` is allowed during Implementation Gate.

Expected generated/modified files may include:

* `package.json`
* `package-lock.json`
* `vite.config.ts`
* `wrangler.jsonc`
* `.gitignore`
* approved Worker entry/config files

The initializer may add:

```json
"type": "module"
```

and required vinext/Vite/Cloudflare scripts/dependencies.

---

## Generated Diff Gate

Immediately after successful initializer completion:

STOP implementation temporarily and inspect the generated diff.

Review:

* `.gitignore`
* `package.json`
* `package-lock.json`
* `vite.config.ts`
* `wrangler.jsonc`
* every additional generated file
* scripts
* dependency versions
* React/React DOM/RSC peer compatibility
* files outside Allowed Paths

If initializer:

* creates unexpected files outside Allowed Paths;
* materially replaces existing Next.js architecture;
* unexpectedly upgrades/downgrades major framework dependencies;
* creates incompatible React/RSC peer versions;
* requires a larger architecture migration;

record:

`BLOCKER`

and STOP.

Do not blindly accept generated output.

---

# npm 12 Install-Script Policy

Vinext dependency installation may require lifecycle install scripts.

Task 19 may add a narrowly scoped project-level:

```text
allowScripts
```

policy to `package.json`.

Do not:

* change global npm config;
* change user-level npm config;
* add repository `.npmrc`;
* use `--dangerously-allow-all-scripts`;
* use wildcard/broad script approval.

---

## Install Script Identification Gate

Before adding an entry to `allowScripts`, identify the exact blocked dependency.

For each candidate report:

* package name;
* resolved version;
* lifecycle script type;
* dependency chain;
* why vinext requires it;
* whether it is optional/platform-specific;
* why its install script is necessary.

Only explicitly reviewed packages may be allowed.

Do not approve a package merely because npm reports that it contains an install script.

---

## Existing User npm Configuration

Existing user-level npm configuration must not be modified.

If inherited user-level script policy prevents installation even after a valid project-level `allowScripts` configuration:

`BLOCKER`

and STOP.

Do not modify developer-machine global/user npm configuration as a workaround.

---

## Supply-Chain Guardrail

Treat every allowed install script as privileged code execution.

Do not broadly expose production secrets while dependency install scripts execute.

Never approve unrelated lifecycle scripts.

After installation, review:

* direct dependencies added;
* devDependencies added;
* exact versions;
* lockfile changes;
* packages approved for install scripts;
* unexpected transitive/runtime changes;
* framework peer changes.

Any unexpected major framework upgrade/downgrade requires review before continuing.

---

# Vinext / Worker Configuration

After generated-diff review passes, configure only what is required.

Expected configuration:

* current compatibility date;
* `nodejs_compat`;
* custom Worker entry;
* vinext fetch handler;
* native `scheduled()` handler;
* one Cron Trigger;
* Free-compatible logging/observability;
* no plaintext secrets.

Preserve existing Next.js development/build workflow where supported.

Do not perform unrelated framework refactoring.

---

# Cloudflare Workers Free Target

Workers Free is the MVP target.

Implementation must account for current limits, including:

* CPU;
* requests;
* subrequests;
* memory;
* Cron Trigger count.

Lifecycle work must remain:

* bounded;
* network-I/O oriented;
* retryable.

Workers Free viability must be validated rather than assumed.

If runtime evidence shows the required MVP cannot operate safely within Workers Free:

`BLOCKER`

and report the evidence.

Do not silently switch to a paid Cloudflare plan.

---

# Runtime Compatibility Validation

Validate security-sensitive runtime behavior under vinext/workerd.

At minimum:

* SHA hashing;
* AES-256-GCM invitee-token encryption/decryption;
* timing-safe comparisons;
* Buffer usage;
* environment variable access;
* Supabase server clients;
* auth cookies;
* Server Actions;
* Route Handlers;
* Midtrans fetch;
* webhook route;
* signed Storage operations.

If vinext/workerd changes security-sensitive crypto semantics:

`BLOCKER`

Do not casually replace working crypto implementation merely to make deployment pass.

---

# Environment and Secrets

Browser-safe:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
NEXT_PUBLIC_APP_URL
```

Server-only:

```text
SUPABASE_SECRET_KEY
MIDTRANS_SERVER_KEY
MIDTRANS_IS_PRODUCTION
INVITEE_TOKEN_ENCRYPTION_KEY
CRON_SECRET
```

Server-only values must use Cloudflare encrypted secrets/bindings or equivalent approved mechanism.

Do not commit secret values.

Do not place secrets in plaintext Wrangler `vars`.

Do not modify `.env*`.

---

# External Deployment Configuration

Document required operator configuration without performing unrelated dashboard changes.

May include:

* application domain;
* Supabase Auth Site URL;
* Supabase redirect URLs;
* Google OAuth callback compatibility;
* Midtrans Notification URL;
* Cloudflare Worker secrets;
* Cron Trigger;
* staging vs production environment values.

Keep repository changes separate from external dashboard configuration.

---

# Backup / Deployment Safety

Follow:

`docs/architecture/backup/BACKUP-RESTORE.md`

before production migration/deployment operations where applicable.

Task 19 does not require a database migration by default.

Do not claim Supabase Free provides paid PITR capabilities if it does not.

Pre-production checklist must cover:

* development migrations validated;
* migration state recorded;
* backup procedure understood/executed where appropriate;
* restore procedure validated appropriately;
* environment/secrets configured;
* Midtrans Notification URL configured;
* Cron Trigger configured;
* smoke tests prepared.

---

# Smoke Tests

Deployment validation must cover at minimum:

| Flow                            | Required      |
| ------------------------------- | ------------- |
| Home                            | yes           |
| Email/password auth             | yes           |
| Google OAuth callback/config    | yes           |
| Couple Dashboard                | yes           |
| Admin Dashboard authorization   | yes           |
| Builder                         | yes           |
| Private review/preview          | yes           |
| Public invitation valid/invalid | yes           |
| RSVP                            | yes           |
| Wishes                          | yes           |
| Checkout sandbox boundary       | yes           |
| Midtrans webhook reachability   | yes           |
| Private signed Storage assets   | yes           |
| Cron HTTP authorization         | yes           |
| Native scheduled invocation     | yes           |
| Client bundle secret exposure   | scan required |

Do not perform a real production payment solely for Task 19 validation.

---

# Acceptance Criteria

* Active invitation becomes expired at/past `expires_at`.
* Repeated expiry processing is idempotent.
* Draft/payment-pending invitations are unaffected.
* Grace period respects persisted `delete_after`.
* Hard deletion only processes delete-ready expired invitations.
* Storage cleanup happens before DB deletion.
* Partial/incomplete Storage cleanup retains invitation.
* Missing Storage objects are retry-safe.
* DB deletion failure remains retryable.
* Transactions survive invitation deletion.
* Historical transaction snapshots remain unchanged.
* Task 18 revenue remains correct after invitation deletion.
* Overlapping cleanup invocations do not corrupt lifecycle state.
* Manual permanent-delete server action reuses shared cleanup service.
* No manual-delete dashboard UI is added.
* Cron processing is bounded.
* Cron authorization fails closed.
* Operational logs contain no secrets/tokens/signed URLs.
* Native Cloudflare scheduled handler uses shared lifecycle service.
* vinext compatibility is checked before migration.
* vinext generated changes are explicitly reviewed.
* npm lifecycle scripts use only narrowly approved project-level allowlist.
* Existing security-sensitive runtime behavior remains valid.
* Workers Free viability is tested rather than assumed.
* Deployment compatibility/smoke tests pass.
* Task 17 payment semantics remain unchanged.
* Task 20 is not started.

---

# Required Validation

## Lifecycle

* before-expiry no-op
* exact-expiry transition
* past-expiry transition
* repeated expiry no-op
* draft unaffected
* payment_pending unaffected
* grace-period row retained
* delete-ready selection
* deterministic candidate ordering
* bounded candidate processing
* Storage-before-DB ordering
* successful cleanup + deletion
* missing Storage object
* partial Storage failure retains row
* traversal-budget exhaustion retains row
* DB deletion failure retry
* retry after Storage already removed
* already-deleted invitation no-op
* concurrent/repeated cleanup safety

## Transaction Preservation

Remote development database must verify:

* `ON DELETE SET NULL`
* transaction survives invitation deletion
* order ID unchanged
* status unchanged
* paid_at unchanged
* theme snapshot unchanged
* tier snapshot unchanged
* price snapshot unchanged
* duration snapshot unchanged
* Task 18 revenue remains correct

## Manual Delete Server Action

* unauthenticated rejection
* cross-owner rejection
* owner success
* explicit permanent-delete intent required
* Storage-before-DB
* transaction survives
* no refund
* no payment mutation
* shared lifecycle service reused

No Couple Dashboard UI test is required because UI integration is outside Task 19.

## Cron

* missing `CRON_SECRET`
* invalid secret
* valid secret
* wrong HTTP method
* bounded batches
* scheduled handler invokes shared service
* repeated invocation safe
* failure propagation
* safe structured logging
* no secrets/tokens/signed URLs logged

## Vinext / Dependency

* `vinext check`
* `vinext init`
* generated diff review
* `.gitignore` contains only approved additions
* exact `allowScripts` candidates reviewed
* no broad lifecycle-script permission
* dependency diff review
* no unexpected framework major change
* React/RSC peer compatibility
* vinext build
* Wrangler configuration validation
* local workerd execution
* local scheduled-handler invocation

## Runtime Security

* SHA behavior
* AES-256-GCM round trip
* timing-safe comparison
* Buffer compatibility
* Supabase server auth
* Server Actions
* Route Handlers
* Midtrans fetch/webhook
* signed Storage flow
* environment secret access
* client bundle secret scan

## Regression

* Task 13 Storage cleanup
* Task 15 expiration behavior
* Task 16 RSVP/Wishes expiration
* Task 17 payment/lifecycle
* Task 18 historical revenue

## Final Validation

* focused Task 19 tests
* lifecycle/security negative tests
* relevant Task 13/15/16/17/18 regressions
* full `npm run test`
* `npm run typecheck`
* `npm run lint`
* targeted read-only Biome
* existing Next.js production build
* vinext production build
* Wrangler validation
* local scheduled-handler validation
* dedicated remote Supabase lifecycle/FK/concurrency validation
* appropriate Cloudflare preview smoke tests
* scoped `git diff --check`
* actual Allowed Paths review
* credential/secret scan
* dependency/lockfile review
* schema/RLS/migration review
* client bundle secret scan
* staged-file review
* `git diff --cached --name-only`
* `git diff --cached --check`

Do not run repository-wide autofix.

---

# Implementation Gates

## Gate A — Vinext Generated Diff

After `vinext init` succeeds:

STOP implementation temporarily.

Report:

* `.gitignore` diff;
* `package.json` diff;
* `package-lock.json` diff;
* `vite.config.ts`;
* `wrangler.jsonc`;
* additional generated files;
* dependency versions;
* framework/React peer changes;
* files outside Allowed Paths.

Continue only if generated diff is within approved scope.

## Gate B — npm Install Scripts

If npm blocks lifecycle scripts:

STOP before broad approval.

Identify exact package/version/script/dependency chain.

Only narrowly approved `allowScripts` entries may be added.

No global npm config modification.

## Gate C — Runtime Compatibility

If vinext/workerd reveals an unsupported security-sensitive runtime behavior:

`BLOCKER`

and STOP.

## Gate D — Remote Database

Dedicated remote development database validation is mandatory.

If remote development access is unavailable:

`BLOCKER`

before completion.

Never substitute production database.

## Gate E — Workers Free Viability

If actual workerd/Cloudflare validation demonstrates Task 19 cannot safely operate within Workers Free:

`BLOCKER`

and report evidence.

Do not silently change billing architecture.

---

# Completion Output

Only after all mandatory validation passes:

Update:

* `docs/architecture/agent/PROJECT-STATE.md`
* `docs/architecture/agent/HANDOFF.md`

Stage only:

* approved Task 19 implementation;
* approved vinext/Cloudflare configuration;
* approved dependency/lockfile changes;
* approved `.gitignore` additions;
* approved deployment documentation;
* completion documentation.

Do not stage unrelated user-owned files.

Commit Task 19 separately.

Completion report must include:

* final lifecycle architecture;
* actual final batch caps;
* cron expression and operational time;
* vinext version;
* exact direct dependency changes;
* exact approved `allowScripts` packages;
* Cloudflare/Worker configuration summary;
* remote database validation results;
* lifecycle/concurrency results;
* workerd/Cloudflare smoke results;
* focused test count;
* full test count;
* typecheck/lint/build results;
* credential/client-bundle scan results;
* exact commit hash;
* remaining external operator/deployment steps.

Then STOP.

Do not begin Task 20.
