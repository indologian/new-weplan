# Task 16 — RSVP & Wishes

## Goal

Implement public invitee-token-authorized RSVP and Wishes endpoints, with lifecycle/config enforcement, edit-own semantics, safe public Wishes responses, and compatibility with Couple Dashboard visibility.

## Depends On

15

## Required Context

- `docs/architecture/reference/API.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only definitions directly related to:
  - `invitations`
  - `invitation_guests`
  - `rsvps`
  - `wishes`

Do not read unrelated reference documents or unrelated database tables.

Architecture/database files are read-only and must not be modified.

## Allowed Paths

- app/api/invite/\*\*
- app/invitation/\*\*
- features/rsvp/\*\*
- features/wishes/\*\*
- lib/invitee/\*\*
- lib/invitations/public-invitation.ts
- lib/invitations/public-invitation.test.ts
- validations/\*\*
- themes/types.ts
- themes/elegant-green/\*\*
- docs/architecture/agent/PROJECT-STATE.md
- docs/architecture/agent/HANDOFF.md

## Do Not Touch

Any unrelated feature, payment flow, invitation lifecycle mutation, couple/admin dashboard implementation, schema/RLS, dependency, future task, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

## Public Authorization Model

Invitees are not Supabase-authenticated users.

All public RSVP/Wishes requests must use:

`guestToken`
→ validate token syntax
→ SHA-256 hash
→ privileged server-only lookup
→ resolve guest + invitation
→ lifecycle/config authorization
→ perform narrow mutation/read

Do not decrypt `guest_token_encrypted`.

Do not expose privileged Supabase credentials to browser code.

Do not grant direct `anon` table access.

## Token Boundary

Incoming token is untrusted.

Raw token may only be used for:

- route/input validation;
- SHA-256 hashing.

After hashing, downstream authorization should use validated internal context.

Do not log:

- raw token;
- token hash;
- encrypted token;
- full personalized URL.

Do not return token material in API responses.

## Lifecycle Gate

Every public RSVP/Wishes read or mutation that depends on an invitation must verify:

- `status = active`
- `expires_at IS NOT NULL`
- `expires_at > now()`

Reject:

- draft
- payment_pending
- expired
- active with null expiry
- active with past/current expiry

`delete_after` does not extend interaction access.

## RSVP Config Gate

RSVP operations additionally require:

`rsvp_enabled = true`

If disabled, public RSVP read/update must be rejected with controlled public error behavior.

Do not mutate the configuration flag in Task 16.

## Wishes Config Gate

Wishes operations additionally require:

`wishes_enabled = true`

If disabled:

- public Wishes list must not expose active interaction behavior;
- public Wish create/update must be rejected.

Do not mutate the configuration flag in Task 16.

## RSVP API Contract

Implement:

### GET

`GET /api/invite/[guestToken]/rsvp`

Returns only the current invitee's RSVP state.

Safe response example:

- `attendance`
- `guestCount`
- `responded`

Do not return:

- `guest_id`
- `invitation_id`
- database RSVP ID
- token material
- owner/couple information

### PUT

`PUT /api/invite/[guestToken]/rsvp`

Request body may contain only:

- `attendance`
- `guestCount`

Never accept:

- `guestId`
- `invitationId`
- `coupleId`
- invitation status/config fields

Server derives guest and invitation exclusively from validated token.

## RSVP Rules

Allowed attendance:

- `attending`
- `not_attending`

Rules:

### attending

`guestCount >= 1`

### not_attending

Server-authoritative result must be:

`guestCount = 0`

If client submits a nonzero guest count with `not_attending`, normalize to `0` or reject consistently according to the validation contract.

Prefer normalization to `0` because the database invariant already defines that authoritative result.

Do not implement `max_companions`.

## RSVP Persistence

One RSVP per guest.

Use existing unique constraint:

`UNIQUE (guest_id)`

Mutation semantics:

- first submission → create
- later submission → update same guest RSVP

Do not create multiple RSVP history rows.

Upsert/update must remain scoped to the token-resolved guest + invitation pair.

The composite relationship:

`(invitation_id, guest_id)`

must remain valid.

## Wishes API Contract

Implement:

### GET

`GET /api/invite/[guestToken]/wishes`

Returns safe Wishes presentation for the validated invitation.

Each public Wish item should expose only:

- `name`
- `message`
- `createdAt`
- `isMine`

Do not expose:

- Wish database ID
- `guest_id`
- `invitation_id`
- token material
- encrypted token
- hash
- owner IDs

`isMine` is computed server-side by comparing the Wish's guest relationship with the token-resolved invitee.

### PUT

`PUT /api/invite/[guestToken]/wish`

Request body:

- `message`

only.

Do not accept guest/invitation IDs.

## Wish Rules

One Wish per guest.

Existing unique constraint:

`UNIQUE (guest_id)`

Semantics:

- no existing Wish → create
- existing own Wish → update same Wish
- invitee cannot edit another guest's Wish

The token determines ownership.

Guest name shown publicly comes from the related invitation guest record, not from arbitrary request input.

## ## Wish Validation

Message must be validated server-side.

At minimum:

- must be a string;
- trim surrounding whitespace;
- must not be empty after trim;
- maximum length: **500 Unicode characters after trim**.

Do not accept HTML as trusted markup.

Render the message as normal escaped text.

Do not add rich-text/HTML support in Task 16.

Do not use `dangerouslySetInnerHTML`.

## Public Wishes Ordering

Return Wishes in deterministic ordering.

Prefer persisted creation time ordering, e.g.:

- newest first; or
- oldest first

Choose one explicit contract and test it consistently.

Do not rely on implicit database row order.

## Couple Dashboard Compatibility

Task 14 already provides Couple Dashboard visibility.

Task 16 must persist RSVP/Wish rows using the existing database contract so Task 14 automatically reflects:

- attending/not-attending/not-responded
- total attending guest count
- Wishes list

Do not create a second dashboard implementation.

Do not modify dashboard files unless a proven blocker requires it.

## Cross-Invitation Protection

Client never supplies authoritative invitation or guest IDs.

Because token resolves exactly one guest:

token hash
→ guest
→ invitation

all RSVP/Wish operations must remain scoped to that resolved pair.

A token from Invitation A must never be usable to:

- read RSVP for Invitation B;
- write RSVP for Invitation B;
- list Wishes from Invitation B;
- edit Wish belonging to guest from Invitation B.

## Error Model

Public endpoints should fail closed.

Expected cases include:

- malformed token
- unknown token
- disabled RSVP
- disabled Wishes
- inactive invitation
- expired invitation
- invalid body
- malformed attendance/message

Do not expose raw database errors, constraint names, guest existence details, or ownership internals.

Use controlled API responses.

## Privileged Client Boundary

A server-only privileged client may be used only after token validation/hash processing within a narrow invitee authorization helper.

Prefer one reusable internal context such as:

- validated guest identity
- validated invitation identity
- lifecycle/config state

Do not expose this context to browser components.

Do not create a generic privileged CRUD wrapper.

## Concurrency / Upsert Safety

One RSVP and one Wish per guest are protected by database uniqueness.

Implementation must handle concurrent duplicate submissions safely.

Do not rely solely on:

`SELECT existing → INSERT`

without handling unique-conflict race.

Use an upsert/update strategy compatible with existing constraints or controlled retry/error mapping.

Do not change schema solely for this task.

## Acceptance Criteria

- Valid invitee token can read/update own RSVP.
- Valid invitee token can create/update own Wish.
- One RSVP per invitee.
- One Wish per invitee.
- Later RSVP submission edits own RSVP.
- Later Wish submission edits own Wish.
- Invitee cannot edit another guest's RSVP/Wish.
- `not_attending` results in `guest_count = 0`.
- `attending` requires `guest_count >= 1`.
- `rsvp_enabled = false` rejects RSVP operations.
- `wishes_enabled = false` rejects Wish interaction.
- Draft/payment-pending/expired/time-expired invitation rejects interaction.
- Token from another invitation cannot cross authorization boundary.
- Public Wishes list contains only safe fields.
- `isMine` is correct.
- Raw guest/database IDs are not exposed.
- Raw token/hash/encrypted token are not logged or returned.
- Couple Dashboard automatically reflects persisted RSVP/Wish changes.
- No payment/lifecycle mutation is implemented.

## Required Validation

### Authorization

- malformed token rejection
- unknown token rejection
- token hash lookup
- proof encrypted token is not decrypted
- raw token non-logging
- inactive invitation rejection
- expired invitation rejection
- active + null expiry rejection
- active + future expiry success
- RSVP disabled rejection
- Wishes disabled rejection
- cross-invitation protection

### RSVP

- initial RSVP create
- update existing own RSVP
- attending + guest count >=1
- attending + zero rejected
- not-attending normalized to zero
- only one RSVP row per guest
- concurrent duplicate submission safety
- safe GET response fields
- no guest/invitation/database IDs exposed

### Wishes

- create first Wish
- edit existing own Wish
- one Wish per guest
- another guest's Wish cannot be edited
- empty message rejected
- HTML treated as plain text/not trusted markup
- safe Wishes list fields
- correct `isMine`
- deterministic ordering
- guest name derived server-side
- concurrent duplicate submission safety

### Regression / Scope

- Couple Dashboard RSVP summary reflects persisted data
- Couple Dashboard Wishes list remains compatible
- no public RSVP/Wish direct anon DB access
- no payment mutation
- no invitation lifecycle mutation
- no schema/RLS changes

### Final Validation

- focused Task 16 tests
- relevant Task 14 dashboard regressions
- Task 15 token/lifecycle regressions
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 16 files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review
- staged-file review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 16 implementation and completion documentation.

Then STOP. Do not begin Task 17.
