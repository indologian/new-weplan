# Task 20 — Production Hardening

## Goal

Run production-readiness audits across security, payment, data integrity, lifecycle, Storage, accessibility, performance, backup/restore, and Cloudflare deployment.

Fix only findings that:

1. are proven by evidence;
2. are classified Critical/High, or explicitly accepted Medium findings;
3. are documented in the Task 20 remediation register before implementation.

Task 20 must not introduce new product features.

## Depends On

19

## Required Context

- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/PAYMENT.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/implementation/MILESTONES.md`
- `docs/architecture/backup/BACKUP-RESTORE.md`
- `docs/architecture/deployment/CLOUDFLARE-SUPABASE.md`
- `docs/architecture/database/schema.sql` — read-only when required by a specific audit
- `docs/architecture/database/indexes.sql` — read-only when required by a specific audit
- `AGENTS.md`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Do not read unrelated documents unless a specific finding requires them.

## Scope Model

Task 20 has two phases:

### Phase A — Audit

Read-only by default.

No implementation changes.

### Phase B — Remediation

Write access is granted only for exact files attached to approved findings.

Do not use repository-wide write access as implicit permission.

## Audit-Phase Allowed Paths

Read-only:

- application source
- tests
- Supabase migrations/tests
- Cloudflare/vinext configuration
- deployment documentation
- architecture/reference documents
- backup/restore tooling

Writable during audit:

- `docs/architecture/agent/PROJECT-STATE.md` only after completion
- `docs/architecture/agent/HANDOFF.md` only after completion
- Task 20 audit/remediation report under:
  - `docs/architecture/implementation/**`

No application code may be modified during the initial audit.

## Remediation Allowed Paths

For each accepted finding, the audit report must explicitly define:

- finding ID
- severity
- evidence
- affected files
- allowed files to modify
- acceptance test
- regression tests
- rollback consideration

Only those exact files become writable for that finding.

If a required remediation needs architecture change, feature expansion, dependency addition, schema/RLS change, or unrelated file not explicitly approved:

record `BLOCKER` and stop that remediation.

## Do Not Touch

Do not:

- add new product features
- add Task 21 behavior
- redesign working architecture
- refactor unrelated code
- change payment business semantics
- change lifecycle business semantics
- broaden RLS or Storage access
- change transaction snapshots/history
- alter invitee-token architecture
- add paid infrastructure as mandatory
- perform production payment
- perform production destructive database tests
- modify `CURRENT-TASK.md`

Task 20 is hardening, not feature development.

# Audit Severity Model

Use:

## Critical

Exploitable issue that can lead to:

- unauthorized privileged access
- payment activation fraud
- secret exposure
- cross-tenant destructive access
- irreversible financial/data corruption

Must be fixed before production.

## High

Serious issue affecting:

- ownership isolation
- authentication/authorization
- payment integrity
- lifecycle/data integrity
- sensitive information exposure
- repeatable destructive failure

Must be fixed before production.

## Medium

Important reliability/security/accessibility/performance issue but not a direct production blocker unless accepted into remediation scope.

Must be recorded.

Fix only if explicitly accepted.

## Low

Minor issue.

Record only unless trivially safe and explicitly approved.

# Audit 1 — Authentication & Authorization

Audit:

- email/password auth
- Google OAuth callback
- safe return URL
- Couple Dashboard protection
- Admin Dashboard protection
- admin mutation role checks
- public invitee authorization
- cron authorization
- server-only privileged-client boundaries

Verify:

- no authorization depends only on UI hiding
- no browser-supplied role/coupleId/guestId/invitationId becomes authority
- cross-owner operations fail
- privileged clients never enter client bundles

Required negative tests:

- unauthenticated access
- couple → admin
- owner A → owner B invitation
- cross-invitation child mutation
- invalid invitee token
- invalid cron secret

# Audit 2 — Invitee Token Security

Audit Task 14–16 contract:

- random token entropy
- SHA-256 lookup
- AES-256-GCM encrypted recoverable token
- encryption-key handling
- copy link
- regenerate link
- invalidation of old token
- public hash-only authorization

Verify raw token is never:

- persisted plaintext
- logged
- placed in analytics
- returned unnecessarily
- exposed outside narrow interaction boundary

Verify:

- token hash uniqueness
- tamper detection
- malformed encryption key behavior
- regeneration atomicity

# Audit 3 — Payment / Midtrans

Re-run payment threat model.

Verify:

- browser checkout sends only invitationId
- price/theme/tier/duration server-authoritative
- snapshots immutable
- one effective pending checkout
- one paid transaction
- signature verification
- amount verification
- GET Status defense-in-depth
- fraud-status handling
- duplicate webhook
- out-of-order webhook
- paid monotonicity
- compensation
- no browser activation path

Mandatory regression:

- concurrent checkout
- duplicate paid apply
- paid vs terminal race
- failed/expired/cancelled → eligible draft only
- historical snapshots unchanged

No manual admin payment mutation must exist.

# Audit 4 — Database / RLS / Data Integrity

Audit actual remote development DB.

Verify:

- RLS enabled where expected
- role grants
- SECURITY DEFINER functions
- empty search_path
- fully qualified object references
- PUBLIC/anon EXECUTE restrictions
- ownership constraints
- composite FKs
- unique constraints
- partial pending/paid indexes
- Storage policies
- homepage/admin RPC privileges

Run existing:

- ownership pgTAP
- Storage pgTAP
- Gallery pgTAP
- Payment pgTAP
- Admin pgTAP

If Security Advisor access is available, run it.

If unavailable, record limitation rather than claiming PASS.

No RLS/schema change during audit.

# Audit 5 — Storage

Verify:

- `invitation-assets` is private
- no public bucket
- canonical paths
- signed upload authorization
- signed read authorization
- no arbitrary path persistence
- no signed URL persistence
- Story/Gallery/Music ownership
- Storage cleanup
- traversal budgets
- partial failure behavior

Regression:

- cross-owner upload/read/delete
- noncanonical path
- missing objects
- retry cleanup
- partial failure
- foreign invitation cleanup

Known limitation must remain explicit:

image validation is metadata-level, not byte-level WebP proof.

Do not misrepresent it as stronger validation.

# Audit 6 — Lifecycle

Verify:

`active → expired → grace → hard delete`

Specifically:

- exact expiry predicate
- delete_after predicate
- public access already fails at expires_at
- Storage before DB deletion
- transaction `ON DELETE SET NULL`
- historical revenue unchanged
- retry behavior
- cron overlap
- manual delete action
- no refund behavior
- bounded batches

Run remote concurrency regression.

# Audit 7 — Slug / Identifier Races

Verify:

- slug UX availability check is not authority
- DB UNIQUE is final authority
- stale response cancellation works
- concurrent slug creation produces controlled conflict
- invitation URL cannot resolve wrong invitation

Also review:

- theme slug uniqueness
- Midtrans order ID uniqueness
- guest-token hash uniqueness

# Audit 8 — Public Data Exposure

Audit all public surfaces:

- invitation page
- RSVP API
- Wishes API
- public theme props
- error responses

Verify browser never receives:

- couple/profile/auth IDs
- guest DB IDs
- transaction IDs unless intentionally safe
- token hash
- encrypted token
- raw Storage paths
- service credentials
- transaction snapshots not needed publicly

Review client bundle for server-only secrets.

# Audit 9 — Input Validation / Injection

Audit all public/authenticated mutations.

Verify Zod/server validation for:

- slug
- identity
- events
- stories
- gallery
- YouTube URLs
- gifts
- interaction config
- music
- guest CRUD
- RSVP
- Wishes
- payment
- admin mutations
- cron endpoint

Check:

- strict/allowlisted mutation payloads
- no generic arbitrary-column update
- HTML/plain-text boundaries
- no `dangerouslySetInnerHTML` for Wishes
- Maps built from structured coordinates, not stored iframe HTML

# Audit 10 — Accessibility

Audit actual application and public theme behavior.

Minimum:

- keyboard navigation
- visible focus
- form labels
- validation error association
- semantic buttons/links
- dialog/modal keyboard behavior
- image alt text
- heading structure
- color contrast
- reduced motion
- no forced autoplay
- Open Invitation keyboard operability

Use automated checks where available without introducing a new paid dependency.

Record findings separately from functional bugs.

Critical/High accessibility blockers should be remediated before production when they prevent core flows.

# Audit 11 — Responsive / Mobile

Validate core views at representative mobile widths.

Minimum flows:

- Home
- Login/Register
- Couple Dashboard
- Admin Dashboard
- Invitation Builder
- Review/Preview
- public invitation
- RSVP/Wishes
- payment CTA/Snap boundary

Verify:

- no horizontal overflow
- controls tappable
- forms usable
- long guest/account names do not break layout
- gallery/story/media sections adapt
- nav/dashboard usable on small screens

Do not redesign visual style during Task 20.

Fix only usability defects.

# Audit 12 — Performance

Measure representative production builds/runtime.

Audit:

- bundle size warnings
- public invitation JS weight
- image behavior
- Motion usage
- unnecessary client components
- N+1 signed URL/network calls
- dashboard unbounded queries
- cron bounded processing
- Cloudflare Workers Free viability

Do not perform speculative performance refactors.

Only remediate measured bottlenecks.

Prefer:

- server components
- batching
- deterministic bounds
- lazy/conditional interaction code

No paid performance service is required.

# Audit 13 — Reduced Motion

Verify every invitation theme/current reference theme respects:

`prefers-reduced-motion`

Check:

- opening animation
- hero
- countdown
- section transitions
- gallery/story
- music/Open Invitation

Core content must remain usable without animation.

# Audit 14 — Backup & Restore Drill

Use:

`docs/architecture/backup/BACKUP-RESTORE.md`

Perform a documented development-environment backup/restore drill.

Must record:

- source environment
- date/time
- backup mechanism
- checksum/file verification where applicable
- isolated restore target
- migration version
- restore result
- validation queries/tests
- cleanup of temporary restore environment/data

Do not restore directly over production.

Do not claim PITR if unavailable on current Supabase plan.

If full remote restore cannot be executed due tooling/account limitations, record the exact limitation and perform the strongest safe drill available.

Backup success without restore verification is not sufficient.

# Audit 15 — Cloudflare Deployment Readiness

Task 19 established vinext/Workers baseline.

Verify:

- Next.js build
- vinext build
- Wrangler validation
- workerd startup
- scheduled invocation
- Worker/client secret scan
- environment bindings
- cron config
- nodejs_compat
- route/runtime compatibility

External configuration required before production must be listed.

Do not claim production deployment readiness when remote configuration is missing.

# Audit 16 — Cloudflare Preview Smoke

If non-production Cloudflare preview is available, deploy/test preview.

Required smoke flows:

- Home
- Login page
- auth callback route/config
- protected Couple Dashboard
- Admin authorization
- builder/review
- public invitation valid/invalid
- RSVP
- Wishes
- payment checkout sandbox boundary
- webhook reachability
- signed Storage
- cron endpoint
- native scheduled invocation if supported

Do not perform real production payment.

If preview is blocked by missing secrets/configuration, record exact external operator blocker.

Do not fake PASS.

# Audit 17 — External Configuration Checklist

Verify/document required operator configuration:

Cloudflare:

- Worker secrets
- domain
- Cron Trigger
- observability/logging

Supabase:

- Auth Site URL
- redirect URLs
- Google provider
- development/production environment separation

Midtrans:

- sandbox/production keys
- Notification URL
- environment selector

Application:

- `NEXT_PUBLIC_APP_URL`

No secret values in documentation.

# Production Readiness Register

Create:

`docs/architecture/implementation/PRODUCTION-HARDENING.md`

This document becomes the Task 20 audit/remediation register.

For every finding include:

- ID
- category
- severity
- evidence
- affected flow
- affected files
- remediation decision
- accepted/rejected/deferred
- tests required
- final status

Example:

```text
SEC-001
Severity: High
Finding: ...
Evidence: ...
Allowed remediation paths:
- ...
Acceptance:
- ...
Status: Accepted
```

# Remediation Gate

After Audit Phase:

STOP.

Present all findings grouped by:

- Critical
- High
- Medium
- Low
- Operational/External

Do not begin remediation automatically.

Critical/High findings must have proposed minimal remediations.

Medium findings may be recommended but require explicit approval.

Only after explicit approval may code changes begin.

# Remediation Rules

For each accepted finding:

1. modify only explicitly approved files;
2. add focused regression test first or alongside fix;
3. avoid unrelated refactor;
4. rerun affected subsystem regressions;
5. update the hardening register.

If one fix creates a new architecture requirement:

`BLOCKER`

and STOP that remediation.

# Acceptance Criteria

Task 20 is complete only when:

- no unresolved Critical security finding;
- no unresolved High security/payment/data-integrity finding;
- all accepted remediations pass tests;
- ownership/security regressions pass;
- payment concurrency/idempotency regressions pass;
- lifecycle/Storage regressions pass;
- accessibility audit is recorded;
- responsive/mobile audit is recorded;
- performance audit is recorded;
- reduced-motion audit is recorded;
- backup + restore drill is recorded;
- Cloudflare deployment readiness is recorded;
- preview smoke status is recorded truthfully;
- external operator steps are documented;
- no feature scope was added.

Medium/Low findings may remain only when explicitly documented as deferred with rationale.

# Required Validation

## Security / Data

- auth negative tests
- ownership negative tests
- admin role tests
- invitee-token tests
- Storage ownership tests
- database pgTAP suites
- secret/client-bundle scan

## Payment

- concurrent checkout
- signature
- amount mismatch
- duplicate webhook
- out-of-order webhook
- terminal-vs-paid race
- immutable snapshots
- no client activation

## Lifecycle

- expiry
- grace
- cleanup
- transaction survival
- cron overlap
- manual delete
- historical revenue

## UI / UX

- responsive audit
- accessibility audit
- reduced motion
- no autoplay
- key core flows keyboard-usable

## Deployment

- Next.js production build
- vinext production build
- Wrangler validation
- workerd smoke
- scheduled invocation
- preview smoke if environment available
- client bundle secret scan

## Backup

- backup created/verified
- isolated restore performed where safely available
- restored data validated
- drill documented

## Full Regression

- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for remediation files
- builds
- scoped diff checks
- dependency review
- schema/RLS/migration review
- staged-file review

# Completion Output

Update:

- `docs/architecture/implementation/PRODUCTION-HARDENING.md`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Commit only:

- accepted Task 20 remediations
- approved tests
- hardening documentation
- completion records

Do not commit unrelated cleanup/refactors.

Final completion report must include:

- Critical findings: total/open
- High findings: total/open
- Medium findings: total/deferred
- Low findings: total/deferred
- security/RLS results
- payment results
- lifecycle/Storage results
- accessibility result
- mobile/responsive result
- performance result
- backup/restore drill result
- Cloudflare/vinext result
- preview smoke result
- external operator blockers
- full test count
- build results
- exact commit hash

Then STOP.

Do not begin Task 21.
