# Production Hardening Audit Register

## Audit Metadata

- Task: Task 20 — Production Hardening, Audit Phase only
- Baseline commit: `0a663200acac58de9f61a66d00fb74adcdf419c6`
- Audit date: 2026-09-12 (Asia/Jakarta)
- Environments tested: local Next.js production runtime; local vinext/workerd runtime; dedicated remote Supabase development project `vldyyfabvihrljqhhdms`
- Production systems used: none
- Application code, dependencies, schema, RLS, external configuration, staging, and production deployment changed: no
- Tools: Vitest, TypeScript, Biome, Next.js 16.3.4 build/runtime, vinext 1.0.0-beta.9, Wrangler 4.131.1/workerd, Chrome DevTools Protocol, temporary external psycopg 3.2.10 client
- Limitations: Supabase Security Advisor was unavailable to the connected identity; authenticated Couple/Admin/builder browser sessions were not created; no remote Cloudflare preview was uploaded; the backup drill was a rollback-only logical restore of representative rows rather than a full platform backup/restore.

## Critical

No Critical finding was demonstrated.

## High

No High finding was demonstrated. Security-sensitive findings below were kept at Medium/Low where existing controls prevent direct unauthorized access or where the impact is reliability/defense-in-depth.

## Medium

### PAY-001 — Failed checkout compensation is not verified

- Category: Payment reliability and state consistency
- Severity: Medium
- Status: Proven defect
- Evidence: `actions/payments/checkout.ts` calls `compensate_payment_checkout` after Snap creation fails but ignores both the RPC `error` and returned data. `actions/payments/checkout.test.ts` only covers successful compensation and has no compensation-failure assertion.
- Impact: a transient database/RPC failure can leave an invitation in `payment_pending` with a pending transaction even though no usable Snap checkout was returned. The user receives a generic retry message, but a new reservation can remain blocked.
- Affected flow: Couple builder → Bayar & Publish → Midtrans Snap creation failure → compensation.
- Affected files: `actions/payments/checkout.ts`, `actions/payments/checkout.test.ts`.
- Proposed minimal remediation: inspect compensation result; emit a controlled operational error/warning containing only a correlation/order identifier safe for server logs; return a distinct controlled failure that directs recovery without exposing payment metadata. Preserve the atomic RPC and existing commercial authority.
- Tests required: compensation RPC success; compensation RPC error; compensation returns no effective row; no commercial/client-authoritative field introduced; original Snap error remains sanitized.
- Dependency/schema/RLS impact: none expected.

### STOR-001 — Image compression exits before trying lower quality or dimensions

- Category: Storage/image processing reliability
- Severity: Medium
- Status: Proven defect
- Evidence: in `features/invitation-builder/utils/image.ts`, each encoded WebP is passed to `validateOptimizedImageBlob()` before the `blob.size <= MAX_IMAGE_OUTPUT_BYTES` branch. The validator throws for output over 500 KiB, so the first 0.82-quality result over the limit aborts the function and the remaining quality/resize attempts are unreachable. Existing tests only validate the standalone validator.
- Impact: valid input images at or below the 10 MiB source limit can be rejected even when a lower quality or reduced dimension would satisfy the required 500 KiB output target.
- Affected flow: Identity, Story, and Gallery image preparation before signed upload.
- Affected files: `features/invitation-builder/utils/image.ts`, `features/invitation-builder/utils/image.test.ts`.
- Proposed minimal remediation: validate WebP MIME on each attempt, continue quality/resize attempts while size is above target, and apply final size validation only to the selected result or after attempts are exhausted.
- Tests required: first attempt over 500 KiB followed by a valid lower-quality result; resize fallback; all attempts over limit; non-WebP browser fallback; exact 500 KiB boundary.
- Dependency/schema/RLS impact: none expected.

### PERF-001 — Public invitation and Couple Dashboard load effectively unbounded sets

- Category: Performance and availability
- Severity: Medium
- Status: Proven scalability defect
- Evidence: `lib/invitations/public-invitation.ts` loads events, stories, gallery items, gifts, and wishes using five `.range(0, 9999)` queries for every public request. `lib/invitee/wishes.ts` independently loads up to 10,000 wishes. `actions/dashboard/dashboard.ts` loads up to 10,000 invitations and then runs three additional queries per invitation via `Promise.all`, each also ranged to 10,000 rows. The production vinext build confirms these routes are dynamic.
- Impact: data and query work scale with the complete account/invitation history; a large legitimate dataset can produce high database load, large server memory/response payloads, and Workers CPU/runtime pressure. The dashboard pattern is N invitations × 3 interaction queries.
- Affected flow: public invitation rendering, public wishes refresh, Couple Dashboard overview and invitation selection.
- Affected files: `lib/invitations/public-invitation.ts`, `lib/invitee/wishes.ts`, `actions/dashboard/dashboard.ts`, their focused tests.
- Proposed minimal remediation: introduce architecture-approved bounded pagination/caps for presentation lists and aggregate counts server-side in a trusted, ownership-aware query/RPC. Do not weaken RLS or expose ownership metadata. This needs remediation approval because an aggregate RPC would add database/API scope.
- Tests required: deterministic page limits/order; large fixture does not fetch 10,000 rows; correct aggregate counts; ownership and public-response minimization; no N+1 query growth.
- Dependency/schema/RLS impact: no dependency or RLS change expected; a narrowly scoped read-only aggregate RPC/migration may be required and must be separately approved.

### SEC-001 — Security response headers are absent

- Category: Browser security defense-in-depth
- Severity: Medium
- Status: Proven defense-in-depth gap
- Evidence: `next.config.ts` only enables `reactStrictMode`. A production Next.js response from `/` had no `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, or `X-Content-Type-Options` header. No equivalent header configuration exists in the repository.
- Impact: the application lacks application-owned clickjacking protection and browser hardening against content injection, MIME confusion, referrer leakage, and unnecessary browser capabilities. No current XSS or secret leak was demonstrated, so this is not rated High.
- Affected flow: all browser routes, especially auth, dashboard/admin mutations, payment CTA, and bearer-token invitation URLs.
- Affected files: `next.config.ts`; a focused configuration/runtime test file.
- Proposed minimal remediation: define an architecture-reviewed header set compatible with Supabase Auth, Midtrans Snap, YouTube/maps embeds, signed Storage URLs, and vinext/Cloudflare. Prefer CSP `frame-ancestors` with a compatible `X-Frame-Options`; configure HSTS at the HTTPS edge only after domain readiness.
- Tests required: production response header assertions on representative public/auth/protected routes; CSP compatibility smoke for OAuth, Midtrans, embeds, signed assets, and vinext/workerd.
- Dependency/schema/RLS impact: none expected; Cloudflare edge HSTS may require separately approved external configuration.

## Low

### A11Y-001 — Field errors are not programmatically associated with inputs

- Category: Accessibility
- Severity: Low
- Status: Proven accessibility gap
- Evidence: `app/(auth)/_components/auth-form.tsx` renders client validation errors as adjacent spans, but inputs do not set `aria-invalid` or `aria-describedby`, and client-side error spans are not live regions. In the runtime DOM, email/password have labels but no described-by relationship. `features/wishes/public-wishes.tsx` likewise does not associate its character counter/error with the textarea.
- Impact: screen-reader users may not learn which field failed or hear updated validation feedback reliably. Labels and semantic controls are otherwise present.
- Affected flow: login/register and public wish entry.
- Affected files: `app/(auth)/_components/auth-form.tsx`, `features/wishes/public-wishes.tsx`, focused component tests.
- Proposed minimal remediation: stable error/help IDs, `aria-invalid`, `aria-describedby`, and an appropriate live status/alert strategy without duplicative announcements.
- Tests required: accessible-name and error-description relationships; invalid/valid state transitions; keyboard submission.
- Dependency/schema/RLS impact: none.

### A11Y-002 — Reference theme opens with an H2 before its H1

- Category: Accessibility/document outline
- Severity: Low
- Status: Proven accessibility gap
- Evidence: `/themes/elegant-green` initially renders `H2: Dear Dear Guest` before `H1: John & Jane` in `themes/elegant-green/sections/open-invitation.tsx`. Keyboard activation of the Open Invitation control succeeds, and reduced-motion content remains visible.
- Impact: assistive-technology heading navigation receives a confusing initial hierarchy; no content or control is inaccessible.
- Affected flow: reference theme Open Invitation screen.
- Affected files: `themes/elegant-green/sections/open-invitation.tsx`, focused theme test.
- Proposed minimal remediation: preserve the visual design while making the invitation/couple heading the first logical heading and the salutation non-heading or subordinate after it.
- Tests required: initial heading order and keyboard-open regression.
- Dependency/schema/RLS impact: none.

## Operational / External

### OPS-001 — Cloudflare preview is still blocked by missing required bindings

- Category: Deployment readiness
- Severity: Operational / External
- Status: Confirmed external configuration gap
- Evidence: read-only `wrangler secret list --name weplan` shows `SUPABASE_SECRET_KEY`, `MIDTRANS_SERVER_KEY`, and `CRON_SECRET`, but not `INVITEE_TOKEN_ENCRYPTION_KEY` or `MIDTRANS_IS_PRODUCTION`. These two names remain required by `wrangler.jsonc`. No values were read or printed and no remote upload/configuration change was attempted.
- Impact: a remote preview version cannot pass the required binding gate; production promotion must remain blocked.
- Affected flow: Cloudflare version-preview creation and remote smoke testing.
- Affected files: no code defect demonstrated; external Worker secret/variable configuration and deployment checklist.
- Proposed minimal remediation: operator configures the two required values in the intended non-production preview environment, then performs preview upload and the approved smoke matrix. Never put values in repository files.
- Tests required: remote preview startup; auth/public invitation/payment configuration validation; scheduled handler; secret-name scan with values hidden.

### OPS-002 — Full backup/restore could not be executed with available tooling/target

- Category: Disaster recovery
- Severity: Operational / External
- Status: Operational limitation; partial drill completed
- Evidence: no isolated database restore target or platform backup restore capability was available to the audit session. The strongest safe drill used a rollback-only schema in the dedicated development DB, seeded one representative invitation and transaction, copied both logical tables, restored them into separate tables, and verified row counts and checksums. All changes rolled back. This is not a full schema/auth/storage restore.
- Impact: end-to-end RPO/RTO and full database/auth/storage recovery remain unverified.
- Affected flow: disaster recovery.
- Affected files: `docs/architecture/backup/BACKUP-RESTORE.md` and operator runbook only; no remediation code inferred.
- Proposed minimal remediation: provision an isolated restore target and execute the documented platform/logical backup restore, migration comparison, auth/storage verification, checksum sampling, RPO/RTO recording, and cleanup.
- Tests required: genuine full restore and validation; do not convert the partial drill into PASS.

### OPS-003 — Supabase Security Advisor unavailable

- Category: Database operational assurance
- Severity: Operational / External
- Status: Unavailable
- Evidence: both security and performance Advisor requests returned permission denied for the connected identity.
- Impact: Advisor notices could not be incorporated into this audit. Direct catalog inspection and pgTAP passed but are not a substitute for Advisor output.
- Proposed minimal remediation: an authorized operator exports/reviews current Advisor findings for the dedicated development project, then repeats for production before launch.
- Tests required: record Advisor output and disposition without exposing credentials.

### OPS-004 — Authenticated visual smoke coverage is incomplete

- Category: Accessibility/mobile acceptance
- Severity: Operational limitation
- Status: Partially verified
- Evidence: unauthenticated requests to Couple/Admin routes correctly redirected to `/login`; the audit did not create or use browser login credentials, so authenticated Couple Dashboard, Admin Dashboard, builder, review, and checkout visual states were not exercised.
- Impact: source and automated authorization tests pass, but visual keyboard/mobile regressions inside authenticated screens remain possible.
- Proposed minimal remediation: use dedicated non-production couple/admin browser fixtures and run the approved 320/375/393 px keyboard, focus, dialog, error, and CTA matrix.
- Tests required: authenticated browser smoke with isolated fixtures; retain server-side authorization negative tests.

### OPS-005 — vinext compatibility remains pre-release/partially classified

- Category: Runtime readiness
- Severity: Operational observation
- Status: Accepted platform limitation requiring preview evidence
- Evidence: `vinext check` reports 97% compatibility, 17 supported items, one partial `reactStrictMode` item, and zero issues; several dynamic routes are shown as unknown by static analysis. The selected packages remain beta. Both builds and local workerd pass.
- Impact: local compatibility evidence is strong, but remote preview/runtime observation is still required before production promotion.
- Proposed minimal remediation: no dependency change inferred. Complete remote preview smoke after OPS-001 and monitor errors/CPU under representative flows.
- Tests required: remote public/auth/dashboard/payment/webhook/cron smoke and production-like observability review.

## Verified Controls / No Finding

- Authentication/authorization: safe internal return-path validation rejects absolute, protocol-relative, backslash, encoded, and malformed bypasses; server-side owner/admin checks and negative tests pass; privileged Supabase clients remain server-only.
- Invitee tokens: cryptographic random token generation, SHA-256 lookup, AES-256-GCM ciphertext, strict 32-byte key validation, unique hash, regenerate invalidation, tamper rejection, and controlled copy-link behavior are implemented. No tracked secret/token value or client bundle secret name was found.
- Payment: browser input is strict `invitationId`; commercial values are resolved and snapshotted server-side; webhook signature, amount, GET Status verification, duplicate/out-of-order handling, paid monotonicity, and no-browser activation are covered. Real two-session reservation produced one success and one controlled `P0001` rejection with exactly one pending transaction.
- Database/RLS: all 13 public tables have RLS enabled. Five remote pgTAP suites passed 107 assertions. All seven public `SECURITY DEFINER` functions use `search_path=""`; focused grant/revoke, ownership, Storage, payment, gallery, and admin tests passed. Security Advisor remains OPS-003.
- Storage: `invitation-assets` is private, limited to 10 MiB, and has the expected WebP/audio MIME allowlist. Canonical paths, ownership checks, signed upload/read, non-persistence of signed URLs, traversal rejection, bounded/idempotent cleanup, and partial-failure retention are covered. The documented metadata-level image validation limitation remains; byte-level WebP proof was not claimed.
- Lifecycle: predicates, grace retention, Storage-first deletion, transaction survival, retry/idempotency, bounded batches, and manual/cron authorization are covered by tests/source review. Local native scheduled invocation returned HTTP 200 and emitted a structured zero-candidate result in 888 ms. No new destructive lifecycle fixture was needed for the empty dedicated development baseline.
- Slug/identifiers: availability is UX-only; stale requests are suppressed; global existence response is minimal; database uniqueness remains final. Midtrans order IDs and guest-token hashes have database uniqueness authority.
- Public exposure/input: no couple/profile/guest database IDs, token hash/ciphertext, transaction metadata, raw private path, or server secret was found in public ViewModels/client bundles. Wishes render as escaped React text; server Zod boundaries use allowlisted payloads and no arbitrary-column mutation was found.
- Music/reduced motion: no mount autoplay; playback follows explicit Open Invitation gesture. `MotionConfig reducedMotion="user"` applies to the reference theme. Under emulated `prefers-reduced-motion: reduce`, Open Invitation stayed visible, keyboard Enter opened usable content, zero sections remained opacity/display hidden, and no horizontal overflow occurred.

## Backup / Restore Drill

- Source: dedicated remote Supabase development project only.
- Timestamp: 2026-09-12 23:25 Asia/Jakarta (approximately 16:25 UTC).
- Method: rollback-only isolated logical schema drill via psycopg; one representative invitation and immutable transaction snapshot were seeded inside the transaction.
- Artifact verification: invitation and transaction copies each contained one row; deterministic logical checksums matched their restored copies.
- Restore target: separate tables within temporary schema `task20_restore_drill`.
- Migration state observed: five migrations; latest `20260912170000`.
- Cleanup: the transaction was rolled back; no persistent fixture/schema remained.
- Result: PARTIAL PASS only. A genuine full database/auth/storage restore was not executed; see OPS-002.

## Accessibility

- Chrome/CDP verified semantic buttons, labelled login inputs, keyboard Open Invitation activation, visible reduced-motion content, image alt attributes in source, no initial autoplay, and protected-route redirects.
- Concrete gaps: A11Y-001 and A11Y-002.
- Authenticated dashboard/admin/builder visual coverage remains OPS-004.

## Mobile / Responsive

- Actual emulated layout viewports: Home 320 px, Login 375 px, reference theme 393 px.
- Each reported `documentElement.scrollWidth === innerWidth`; no horizontal overflow was reproduced.
- Open Invitation remained visible/operable at 393 px and post-open content had no hidden sections or horizontal overflow.
- Couple/Admin unauthenticated requests redirected safely to Login at 375/393 px; authenticated inner screens remain OPS-004.
- No reproducible mobile finding was registered.

## Performance

- Next.js and vinext production builds completed without bundle warnings.
- Wrangler dry-run total upload: 1961.08 KiB, 552.22 KiB gzip; 180 modules.
- Largest emitted client chunks observed: identity form 252.2 KiB, framework 185.7 KiB, elegant-green 160.2 KiB, vinext 143.5 KiB, index 132.8 KiB, schemas 106.5 KiB. No threshold failure was asserted from size alone.
- Signed assets use batched `createSignedUrls`.
- Concrete query/load issue: PERF-001. Concrete image-processing issue: STOR-001.

## Cloudflare / vinext

- Next.js production build: PASS.
- `vinext check`: PASS with 97% compatibility, one documented partial, zero issues.
- vinext production build: PASS.
- Wrangler dry-run: PASS; bindings include Assets and Worker Version Metadata.
- Configuration review: cron `0 19 * * *`, `nodejs_compat`, compatibility date `2026-09-12`, observability/logging, and required secret declarations present.
- Local workerd: Home HTTP 200; `/cdn-cgi/local/scheduled` HTTP 200 with body `ok`; lifecycle structured run completed in 888 ms.
- Remote preview: NOT RUN because required remote bindings remain missing (OPS-001). No external configuration was changed.

## Validation

- Focused security/ownership/Storage/payment/lifecycle/invitee/admin suite: 12 files, 65 tests passed.
- Full Vitest suite: 86 files, 402 tests passed.
- Remote pgTAP: ownership 17/17; Storage security 21/21; gallery/tier limits 28/28; payment 27/27; admin overview 14/14; total 107/107 passed.
- Remote payment reservation concurrency: PASS, two real sessions; one success, one controlled rejection, one pending transaction; fixtures cleaned.
- Typecheck: an initial run against stale generated `.next` types failed; after the required clean production build regenerated types, `npm run typecheck` passed. No source TypeScript error remained.
- Standard lint: PASS, 105 files checked, no fixes applied.
- Next.js production build: PASS, 17 static pages generated and dynamic routes compiled.
- vinext build/check and Wrangler dry-run/local scheduled: PASS as detailed above.
- Credential scan: zero tracked credential-pattern matches; zero sensitive server secret-name matches in `dist/client`; only `.env.example` is tracked.
- Security Advisor: unavailable (OPS-003), not PASS.

## Proposed Remediation Register

| Finding | Exact proposed files | Minimal fix | Regression tests | Dependency impact | Schema/RLS/API impact |
| --- | --- | --- | --- | --- | --- |
| PAY-001 | `actions/payments/checkout.ts`; `actions/payments/checkout.test.ts` | Verify compensation result and produce safe, observable controlled recovery failure | compensation success/error/no-row, sanitized response | none | none |
| STOR-001 | `features/invitation-builder/utils/image.ts`; `features/invitation-builder/utils/image.test.ts` | Continue quality/resize loop for oversized valid WebP; validate final result | quality fallback, resize fallback, exhaustion, MIME and boundaries | none | none |
| PERF-001 | `lib/invitations/public-invitation.ts`; `lib/invitee/wishes.ts`; `actions/dashboard/dashboard.ts`; focused tests; optionally one approved migration/database test | Bound/paginate display data and replace dashboard N+1/full scans with trusted aggregates | large-data bounds, ordering, counts, ownership, response minimization | none | possible new read-only RPC; no RLS change expected, separate approval required |
| SEC-001 | `next.config.ts`; focused header/runtime test | Add CSP/frame/referrer/MIME/permissions headers compatible with current integrations | response headers plus OAuth/Midtrans/embed/signed-asset/workerd smoke | none | no DB/RLS; possible separately approved edge HSTS config |
| A11Y-001 | `app/(auth)/_components/auth-form.tsx`; `features/wishes/public-wishes.tsx`; focused tests | Associate inputs with errors/help and expose state accessibly | accessible descriptions and state transitions | none | none |
| A11Y-002 | `themes/elegant-green/sections/open-invitation.tsx`; theme test | Correct initial heading hierarchy without visual redesign | heading order and keyboard open | none | none |

## Audit Gate

Audit phase complete. Remediation has not started. This register must be reviewed and explicitly approved before any application, dependency, migration, RLS, external configuration, staging, or deployment change.
