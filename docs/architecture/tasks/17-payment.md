# Task 17 — Payment

## Goal

Implement secure Midtrans checkout, server-authoritative commercial snapshots, payment-pending locking, verified/idempotent webhook processing, and atomic invitation activation.

## Depends On

16

## Required Context

- `docs/architecture/reference/PAYMENT.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only definitions directly related to:
  - `invitations`
  - `themes`
  - `tiers`
  - `transactions`

- `docs/architecture/database/indexes.sql` — read-only, only payment/invitation indexes and constraints
- current official Midtrans documentation for:
  - Snap checkout
  - HTTP notification/webhook
  - notification signature verification
  - transaction statuses
  - transaction status API

Do not read unrelated reference documents or unrelated database tables.

## Allowed Paths

- `app/api/payments/**`
- `features/payments/**`
- `lib/midtrans/**`
- `actions/payments/**`
- `supabase/migrations/**`
- `supabase/tests/database/**`
- `docs/architecture/database/**` only for approved payment-function/constraint documentation
- `features/invitation-builder/components/checkout-boundary.tsx`
- `features/invitation-builder/components/checkout-boundary.test.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, admin dashboard, cleanup cron/lifecycle Task 19, public RSVP/Wishes, Storage architecture, dependency, or unrelated database architecture.

If implementation requires changes outside Allowed Paths, record a BLOCKER and stop that part.

## Payment Authority

Browser may initiate checkout using only:

`invitationId`

Browser must never be trusted for:

- price
- theme ID/name
- tier ID/code/name
- active months
- transaction status
- paid state
- Midtrans order ID
- lifecycle timestamps

Server resolves all commercial values from persisted invitation → theme → tier.

## Checkout Eligibility

Checkout is permitted only when:

- authenticated couple owns invitation;
- invitation status is `draft`;
- no paid transaction exists for invitation;
- no other effective pending checkout exists.

Invitation status transitions:

`draft → payment_pending`

only as part of server-controlled checkout reservation.

While `payment_pending`:

- content editing remains allowed according to existing architecture;
- theme/tier remain locked;
- duplicate checkout is rejected.

Task 17 must not implement renewal.

## Transaction Snapshot

At checkout creation, persist immutable snapshot:

- `theme_id_snapshot`
- `theme_name_snapshot`
- `tier_code_snapshot`
- `tier_name_snapshot`
- `price_snapshot`
- `active_months_snapshot`

Future changes to themes/tiers must not mutate existing transaction snapshot.

Runtime price comes from database tier relation, not browser input.

## Midtrans Order ID

Generate Midtrans order ID server-side.

Requirements:

- globally unique;
- mapped 1:1 to transaction row;
- never accepted from browser.

`transactions.midtrans_order_id` remains lookup key for webhook processing.

## Atomic Checkout Reservation

Checkout reservation must be atomic at database level.

Create an approved PostgreSQL function/RPC that in one transaction:

1. obtains authenticated caller;
2. verifies invitation ownership;
3. acquires transaction-scoped advisory lock for invitation;
4. verifies invitation is checkout-eligible;
5. resolves current theme/tier server-side;
6. snapshots commercial values;
7. inserts pending transaction with server-generated Midtrans order ID;
8. changes invitation:
   `draft → payment_pending`;
9. returns only data needed for Midtrans checkout creation.

Do not perform:

`SELECT eligibility → INSERT transaction → UPDATE invitation`

as independent application requests.

## Pending Checkout Uniqueness

Database must prevent multiple simultaneous effective pending checkouts for one invitation.

Use approved database constraint/index and/or advisory-locked RPC semantics.

If adding a partial unique index for pending transaction is compatible with existing history requirements, it may be used as defense-in-depth.

Historical failed/expired/cancelled transactions must remain allowed.

Only one transaction can ultimately be `paid`.

## Midtrans Checkout Creation

After successful DB reservation:

server
→ create Midtrans Snap transaction using snapshot amount/order ID
→ return only safe checkout data required by frontend

Never expose `MIDTRANS_SERVER_KEY`.

Client-side Midtrans callback is UX only.

Browser success callback must NOT:

- mark transaction paid;
- activate invitation;
- set paid_at;
- set published_at;
- set expires_at.

## Midtrans Creation Failure Compensation

If DB reservation succeeds but Midtrans checkout creation fails:

perform controlled compensation:

- mark reserved transaction failed/cancelled according to internal contract;
- return invitation from `payment_pending` to `draft` only if:
  - this transaction is still the effective pending transaction;
  - no paid transaction exists;
  - invitation has not otherwise transitioned.

Compensation must be idempotent and database-authoritative.

Do not leave invitation permanently stuck in `payment_pending` because Midtrans token creation failed.

## Webhook Endpoint

Public Midtrans endpoint:

`POST /api/payments/midtrans/notification`

No user authentication.

It must never trust browser/session identity.

Webhook processing begins with authenticity verification.

## Signature Verification

Verify Midtrans:

`signature_key`

using:

`SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`

Use exact notification values.

Reject invalid signature before mutation.

Server Key remains server-only.

Do not log Server Key or calculated secret material.

## Defense-in-Depth Status Verification

Webhook handler should additionally verify transaction information through Midtrans Transaction Status API when required by the approved payment architecture or when notification state is ambiguous.

Do not trust arbitrary browser payment state.

If status API verification is used, compare returned:

- order ID
- transaction status
- gross amount
- relevant fraud status

against persisted transaction snapshot.

## Amount Verification

Before applying any successful payment:

Midtrans `gross_amount` must match:

`transactions.price_snapshot`

using safe IDR amount normalization.

Do not activate invitation if amount differs.

Do not trust webhook amount solely because signature is structurally valid.

## Midtrans Status Mapping

Map Midtrans statuses deliberately.

Internal pending:

- `pending`

Successful candidate statuses:

- `capture`
- `settlement`

For successful processing require:

- appropriate successful Midtrans status;
- `status_code = 200`;
- `fraud_status = accept` when fraud status exists;
- gross amount matches snapshot.

Failure/internal mapping:

- `deny` → `failed`
- `failure` → `failed`
- `expire` → `expired`
- `cancel` → `cancelled`

Do not invent transaction-state handling for refund/chargeback in MVP unless architecture explicitly expands scope.

Unexpected statuses must fail closed / be ignored safely rather than mutate invitation incorrectly.

## Capture / Settlement Rule

Because Midtrans documents `capture` as successful but it may later transition, implement one explicit monotonic rule:

- first verified successful `capture` or `settlement` may mark transaction `paid` and activate invitation;
- once Weplan transaction is `paid`, later duplicate or lower/terminal notifications must NOT revert invitation to `draft`;
- later `settlement` after `capture` is idempotent success;
- later `cancel`/`deny`/`expire` must not undo already-paid Weplan activation automatically.

Refund/chargeback/cancellation-after-payment business handling is outside MVP Task 17 and must not silently deactivate invitation.

## Failed / Expired / Cancelled Payment

For a transaction that has never become paid:

verified terminal status:

- failed
- expired
- cancelled

must:

1. update transaction terminal status;
2. return invitation:
   `payment_pending → draft`

only when:

- the transaction belongs to that invitation;
- it is still the effective pending transaction;
- no paid transaction exists.

After returning to draft:

- theme/tier become changeable again;
- user may create a new checkout;
- new checkout uses current commercial snapshot.

Historical transaction remains stored.

## Webhook Idempotency

Webhook may arrive:

- multiple times;
- delayed;
- out of order.

Processing must be idempotent and monotonic.

Use transaction/order ID as stable identity.

Repeated equivalent notification must not:

- create duplicate transaction;
- activate twice;
- change paid_at twice;
- extend active duration twice;
- reset invitation.

## Atomic Payment Application

Create approved PostgreSQL function/RPC for verified webhook state application.

Application verifies signature/status/amount first, then RPC performs authoritative DB transition.

For first verified paid transition, in one DB transaction:

1. acquire advisory lock for invitation/transaction;
2. verify transaction exists and snapshot is valid;
3. verify it has not already been paid;
4. set:
   - transaction.status = `paid`
   - transaction.payment_type
   - transaction.paid_at

5. set invitation:
   - status = `active`
   - paid_at = verified payment time
   - published_at = paid_at
   - expires_at = paid_at + `active_months_snapshot`
   - delete_after = expires_at + 7 days

6. preserve exactly one paid transaction per invitation.

No partial state where transaction is paid but invitation remains payment_pending.

## Payment Time

`paid_at` must derive from verified Midtrans payment/settlement transaction time according to approved mapping, not browser clock.

If Midtrans does not provide a trustworthy successful timestamp for a specific notification, use an explicitly documented server-side fallback.

Do not let client choose activation start time.

## Expiration Calculation

For paid activation:

`expires_at = paid_at + active_months_snapshot`

Use database date/time arithmetic.

Do not calculate lifecycle duration from current tier after payment.

Then:

`delete_after = expires_at + 7 days`

Task 17 only sets these lifecycle timestamps.

Task 17 does NOT implement expiration cleanup or hard deletion.

That belongs to Task 19.

## Checkout Response

Return only safe frontend checkout information, such as:

- Midtrans Snap token
- server-resolved order ID if required by client SDK
- safe display amount if required for UX

Do not return:

- Server Key
- transaction internal snapshots beyond what UI needs
- secret verification material.

## Payment-Pending UI Boundary

Task 17 may implement the checkout client feature required to invoke Midtrans Snap.

Reuse Task 12 checkout boundary.

If connecting the existing Task 12 `Bayar & Publish` CTA requires changes outside Allowed Paths, report BLOCKER before coding.

Do not duplicate the entire review page.

## Error Model

Public webhook responses must not expose:

- server key;
- SQL errors;
- constraint names;
- internal transaction snapshots;
- invitation ownership details.

Authenticated checkout failures should use controlled errors.

Expected duplicate webhook should return safe successful/idempotent response when already applied.

## Logging

Structured logs may include:

- internal transaction/order identifier
- mapped status
- high-level result

Do not log:

- Midtrans Server Key
- signature source concatenation containing secrets
- full sensitive webhook payload unnecessarily
- Snap token
- privileged DB credentials.

## Acceptance Criteria

- Browser checkout request only supplies `invitationId`.
- Server resolves price/theme/tier/duration.
- Transaction snapshot is persisted before payment.
- Duplicate pending checkout is rejected.
- Invitation moves atomically to `payment_pending` with transaction reservation.
- Midtrans creation failure can safely restore eligible invitation to draft.
- Browser callback cannot activate invitation.
- Invalid webhook signature is rejected.
- Amount mismatch cannot activate invitation.
- Duplicate webhook is idempotent.
- Out-of-order webhook cannot regress paid state.
- Verified successful payment atomically sets transaction paid and invitation active.
- `paid_at`, `published_at`, `expires_at`, and `delete_after` are set correctly.
- Active duration uses snapshot, not current tier.
- Failed/expired/cancelled unpaid transaction returns eligible invitation to draft.
- Paid invitation cannot start another checkout.
- Transaction history survives invitation lifecycle.
- Task 17 does not implement expiry cleanup/hard deletion.

## Required Validation

### Checkout Security

- unauthenticated checkout rejection
- cross-owner invitation rejection
- browser-provided price ignored/rejected
- browser-provided tier/theme/duration ignored/rejected
- draft eligible checkout
- payment_pending duplicate rejected
- active invitation rejected
- expired invitation behavior according to architecture
- paid transaction duplicate checkout rejected
- snapshot correctness
- concurrent checkout race test

## Existing Invitation Theme/Tier Availability

For Task 17, `themes.is_active` and `tiers.is_active` control catalog availability for new selection only.

A `draft` invitation that already references a persisted theme/tier remains eligible for checkout even if the referenced theme or tier is later set to `is_active = false`, provided that:

- the invitation is otherwise checkout-eligible;
- the referenced theme row still exists;
- the referenced tier row still exists;
- the persisted theme → tier relationship remains valid.

The checkout reservation must resolve commercial values from the invitation's persisted referenced theme/tier without requiring:

- `themes.is_active = true`;
- `tiers.is_active = true`.

Checkout must still fail safely if the referenced theme/tier relationship is missing or invalid.

Each new checkout reservation creates a fresh immutable transaction snapshot using the current persisted commercial values of the referenced theme/tier at reservation time.

This rule does not introduce renewal semantics.

### Midtrans

- checkout payload uses snapshot amount
- sandbox/production endpoint/config selection
- Server Key never reaches browser
- Snap token handled safely
- Midtrans creation failure compensation

### Signature / Webhook

- valid signature
- invalid signature
- altered amount invalidates expected processing
- unknown order ID
- gross amount mismatch
- duplicate notification
- pending notification
- capture success
- settlement success
- fraud rejection
- deny
- failure
- expire
- cancel
- capture → settlement idempotency
- paid → late cancel does not regress activation
- terminal unpaid duplicate idempotency
- out-of-order terminal notification safety

### Atomic Activation

- transaction and invitation transition together
- activation rollback on DB failure
- exactly one paid transaction per invitation
- paid_at set once
- active duration snapshot calculation
- delete_after = expires_at + 7 days
- no double-extension on duplicate webhook

### Regression / Scope

- Task 12 checkout boundary integration
- Task 14 invitation status presentation
- Task 15/16 public behavior unaffected
- no expiry cleanup/hard delete
- no unrelated schema/RLS changes
- no client activation path

### Final Validation

- focused Task 17 tests
- database pgTAP/security tests for payment RPC/constraints
- multi-session checkout concurrency where infrastructure allows
- duplicate/out-of-order webhook tests
- relevant Task 12/14 regressions
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 17 files
- `npm run build`
- remote migration validation on dedicated development Supabase
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review
- staged-file review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 17 implementation and completion documentation.

Then STOP. Do not begin Task 18.
