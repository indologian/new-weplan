# Agent Handoff

## Task

16 — RSVP & Wishes

## Completed

- Extracted the Task 15 token syntax, SHA-256 lookup, and lifecycle checks into one reusable server-only invitee authorization boundary.
- Kept Task 15 public rendering on the shared authorization primitive without changing slug, renderer allowlist, private asset signing, or user-gesture music behavior.
- Added public RSVP GET/PUT handlers with safe response fields, persisted-state loading, edit-own semantics, and server-authoritative not-attending count normalization.
- Added public Wishes GET and Wish PUT handlers with safe presentation fields, deterministic newest-first ordering, server-derived guest names, and server-computed `isMine`.
- Used atomic Supabase upserts targeting the verified `UNIQUE (guest_id)` constraint while always supplying the trusted token-resolved invitation/guest pair.
- Added RSVP and Wishes feature components and mounted them through narrow theme interaction slots; the raw token remains outside the common invitation ViewModel and is used only to form approved API paths.
- Added public UI support for persisted RSVP loading/editing, guest count, first/edit-own Wish submission, and Wishes refresh after a successful mutation.

## Authorization and security

- Raw tokens are accepted only for exact syntax validation and SHA-256 hashing, and are never logged or returned.
- `guest_token_encrypted` is neither selected nor decrypted.
- Privileged Supabase access remains server-only behind Route Handlers; no direct anonymous table access was added.
- Lifecycle allows only `active` invitations with a non-null future `expires_at`; `delete_after` does not extend access.
- RSVP requires `rsvp_enabled = true`; Wishes requires `wishes_enabled = true`.
- Queries and upserts use trusted `invitation_id + guest_id`; browser payloads cannot select an invitation, guest, owner, lifecycle, or feature flag.
- Public Wishes expose only `name`, `message`, `createdAt`, and `isMine`; RSVP exposes only `attendance`, `guestCount`, and `responded`.
- Expected authorization failures use one generic public response and database errors/constraint details are not exposed.

## Validation contracts

- RSVP attendance is `attending | not_attending` and guest count remains a number.
- Attending requires an integer count of at least one.
- Not-attending is normalized server-side to zero.
- Wish messages are trimmed, non-empty, and limited to 500 Unicode code points after trim.
- Wish content remains unchanged plain text and is rendered through escaped React text without `dangerouslySetInnerHTML`.

## Files created

- `app/api/invite/_shared/public-response.ts`
- `app/api/invite/[guestToken]/rsvp/route.ts`
- `app/api/invite/[guestToken]/wishes/route.ts`
- `app/api/invite/[guestToken]/wish/route.ts`
- `app/api/invite/[guestToken]/routes.test.ts`
- `features/rsvp/public-rsvp.tsx`
- `features/rsvp/public-rsvp.test.tsx`
- `features/wishes/public-wishes.tsx`
- `features/wishes/public-wishes.test.tsx`
- `lib/invitee/authorization.ts`
- `lib/invitee/authorization.test.ts`
- `lib/invitee/errors.ts`
- `lib/invitee/invitee-test-support.ts`
- `lib/invitee/rsvp.ts`
- `lib/invitee/rsvp.test.ts`
- `lib/invitee/wishes.ts`
- `lib/invitee/wishes.test.ts`
- `themes/elegant-green/sections/interactions.test.tsx`
- `validations/invitee-interactions.ts`
- `validations/invitee-interactions.test.ts`

## Files changed

- `app/invitation/[slug]/[guestToken]/page.tsx`
- `app/invitation/_components/public-invitation-renderer.tsx`
- `app/invitation/_components/public-invitation-renderer.test.tsx`
- `lib/invitations/public-invitation.ts`
- `lib/invitations/public-invitation.test.ts`
- `themes/types.ts`
- `themes/elegant-green/index.tsx`
- `themes/elegant-green/sections/rsvp.tsx`
- `themes/elegant-green/sections/wishes.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies, database, and Storage

- No dependency or lockfile changes.
- No schema, migration, RLS, policy, grant, RPC, bucket, or Storage changes.
- No payment, transaction, invitation lifecycle mutation, delete-Wish operation, or Task 17 behavior was added.

## Tests and validation

- Focused Task 16 plus Task 15 regressions: pass, 11 files and 56 tests.
- Explicit Task 14 dashboard and Task 15 public regressions: pass, 8 files and 41 tests.
- Full `npm run test`: pass, 66 files and 326 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 81 standard-scope files checked.
- Targeted read-only Biome: pass, 47 Task 16/integration files.
- `npm run build`: pass; all four approved public interaction methods are represented by three dynamic API routes.
- Scoped diff, raw-token/logging, credential, dependency, schema/RLS, and staged-file reviews: pass.

## Known issues

- The concurrency tests exercise simultaneous service calls against the atomic `onConflict: guest_id` contract; no separate multi-session remote-database race test was required or performed.
- Guest tokens are necessarily present in personalized request URLs, so infrastructure access-log exposure remains an existing architecture limitation; application code does not log them.

## Blockers

None.

## Notes for next agent

- Keep `lib/invitee/authorization.ts` as the single token/lifecycle authorization primitive for public invitee flows.
- Existing user-owned changes in `CURRENT-TASK.md` and Task 10–16 documents remain untouched and excluded from this commit.
- Do not begin Task 17 without explicit authorization.

17 — Payment

## Completed

- Added a native-fetch Midtrans boundary for sandbox/production Snap creation and Transaction Status verification without adding a dependency.
- Added exact SHA-512 notification verification, lossless IDR amount parsing, deliberate status/fraud mapping, and explicit GMT+7 timestamp parsing.
- Connected the existing Task 12 `Bayar & Publish` boundary using only `invitationId`; browser callbacks remain UX-only and cannot activate invitations.
- Added atomic database reservation, idempotent creation-failure compensation, and privileged monotonic payment application functions.
- Persisted server-resolved theme/tier/price/duration snapshots and retained eligibility for existing inactive referenced catalog records.
- Added the pending partial unique index while preserving the existing paid partial unique index and historical terminal transactions.
- Added the public Midtrans notification Route Handler with signature verification, GET Status defense-in-depth, amount verification, minimal responses, and retryable transient failures.

## Files created

- `actions/payments/checkout.ts`
- `actions/payments/checkout.test.ts`
- `app/api/payments/midtrans/notification/route.ts`
- `app/api/payments/midtrans/notification/route.test.ts`
- `features/payments/midtrans-checkout.tsx`
- `lib/midtrans/amount.ts`
- `lib/midtrans/amount.test.ts`
- `lib/midtrans/client.ts`
- `lib/midtrans/client.test.ts`
- `lib/midtrans/config.ts`
- `lib/midtrans/config.test.ts`
- `lib/midtrans/signature.ts`
- `lib/midtrans/signature.test.ts`
- `lib/midtrans/status.ts`
- `lib/midtrans/status.test.ts`
- `supabase/migrations/20260912170000_task17_payment.sql`
- `supabase/tests/database/17_payment.test.sql`
- `docs/architecture/database/payment-functions.sql`

## Files changed

- `features/invitation-builder/components/checkout-boundary.tsx`
- `features/invitation-builder/components/checkout-boundary.test.tsx`
- `docs/architecture/database/indexes.sql`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Database and security validation

- Applied and recorded `20260912170000_task17_payment.sql` on the dedicated remote Supabase development project through the Session Pooler on port 5432.
- Task 17 pgTAP: 27/27 assertions passed.
- Existing ownership regression: 17/17 passed; gallery RPC/security regression: 28/28 passed.
- Verified both pending and paid partial unique indexes, all three `SECURITY DEFINER` functions, empty `search_path`, and narrow grants.
- Verified anon cannot reserve/compensate, authenticated can only reserve/compensate, and payment application is restricted to `service_role`.
- Real multi-session validation passed for concurrent reservation, duplicate paid application, and terminal-versus-paid race; assertions used final transaction and invitation lifecycle state.

## Application validation

- Focused Task 17 plus Task 12/14/15/16 regressions: 15 files and 78 tests passed.
- Full `npm run test`: 73 files and 360 tests passed.
- `npm run typecheck`, standard lint, targeted read-only Biome, and production build passed.
- No dependency, lockfile, unrelated schema/RLS/policy, Storage, cleanup, or Task 18 changes.

## Known issues and blockers

- None.

## Notes for next agent

- Configure the Midtrans Dashboard Notification URL to `/api/payments/midtrans/notification` on the deployed application origin and use environment-matched client/server keys.
- Payment lifecycle is monotonic; refund/chargeback handling and expiration cleanup remain outside Task 17.
- The user-owned Task 17 control-document synchronization remains intentionally unstaged and uncommitted.
- Do not begin Task 18 without explicit authorization.
