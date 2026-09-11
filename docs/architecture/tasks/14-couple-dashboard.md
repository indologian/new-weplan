# Task 14 — Couple Dashboard

## Goal

Implement authenticated Couple Dashboard for overview, owned invitations, guest management, RSVP summary, Wishes management, Gifts management, and account/settings presentation without implementing future public invitee or payment behavior.

## Depends On

13

## Required Context

- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/database/schema.sql` — read-only, only definitions directly related to:
  - `profiles`
  - `invitations`
  - `transactions`
  - `invitation_guests`
  - `rsvps`
  - `wishes`
  - `gift_accounts`

Do not read unrelated reference documents or unrelated database tables.

Architecture/database files are read-only context and must not be modified.

## Allowed Paths

- `app/dashboard/couple/**`
- `features/**`
- `actions/**`
- `lib/**` only when required for dashboard-owned server helpers already defined by architecture
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, public invitee flow, payment creation, admin dashboard, schema/RLS, dependency, future task, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

## Dashboard Sections

Couple Dashboard contains:

- Overview
- Invitations
- Guests
- RSVP
- Wishes
- Gifts
- Settings

All sections are authenticated couple-only functionality.

## Overview

Overview should display owner-scoped summary data such as:

- total invitations
- invitation counts by status
- recent/active invitations
- guest count
- RSVP summary
- Wishes count

Do not implement admin/revenue analytics.

Do not create denormalized analytics tables.

## Invitations

Couple may own multiple invitations.

Invitation list must support:

- view invitation
- resume/edit invitation
- private preview
- status display:
  - `draft`
  - `payment_pending`
  - `active`
  - `expired`

- delete invitation entry point only if existing lifecycle contract allows it

Task 14 must not implement payment checkout or activation.

If payment CTA is shown, it must reuse the existing safe Task 12 boundary and must not create transactions.

Do not duplicate builder implementation.

Edit/resume should link back into the existing builder flow for the same owned invitation.

## Guest Management

Couple can manage invitees manually.

MVP operations:

- add guest
- edit guest name
- delete guest
- copy personal invitation link
- regenerate personal invitation link

No CSV/Excel import in MVP.

Guest identity is based on secure token, not guest name.

Names may duplicate.

## Invitee Token Contract

Guest token must be cryptographically random with at least 128 bits of entropy.

Persistence contract:

- `guest_token_hash`
- `guest_token_encrypted`

Original token must not be stored plaintext.

Public lookup later uses token hash.

Dashboard Copy Link requires server-side decryption of encrypted token.

Use existing architecture:

- SHA-256 for lookup hash
- AES-GCM for encrypted token
- server-only `INVITEE_TOKEN_ENCRYPTION_KEY`

Do not expose encryption key or original token to database/public client beyond the final copied URL returned to the authenticated owner.

Do not log raw token.

## Guest Link

Personal link format follows architecture:

`/invitation/{invitationSlug}/{guestToken}`

Generate final link using server-resolved invitation slug and decrypted/generated token.

Do not accept trusted invitation slug or guest token from arbitrary client input.

## Copy Link

Authenticated owner may request Copy Link at any time.

Server flow:

authenticate
→ verify invitation ownership
→ verify guest belongs to invitation
→ decrypt stored guest token
→ construct personal URL
→ return only URL needed for copy

Do not persist full invitation URL.

## Regenerate Link

Regenerate must:

1. authenticate;
2. verify invitation ownership;
3. verify `guest.id + invitation_id`;
4. generate new cryptographically secure token;
5. calculate new SHA-256 hash;
6. encrypt new original token with AES-GCM;
7. atomically replace stored hash/encrypted token;
8. return newly generated URL.

Old link must become invalid immediately after regeneration.

Do not keep multiple active tokens for one guest.

## Guest Delete

Delete owned guest only.

Existing RSVP and Wish rows associated with guest should follow existing database cascade behavior.

Do not manually bypass database relationship rules unless architecture requires it.

## RSVP Dashboard

Task 14 dashboard RSVP is read/management presentation only.

Display owner-scoped RSVP information:

- attending
- not attending
- not responded
- total attending guest count

Do not implement public invitee RSVP submission/update in Task 14.

That belongs to Task 16.

Dashboard data must come from persisted RSVP records and owned guest list.

Do not fabricate “not responded” rows; derive them from guests without RSVP.

## Wishes Dashboard

Couple can:

- view Wishes belonging to owned invitation
- delete Wishes

Couple does not edit guest Wishes in MVP.

Task 14 does not implement public Wish submission/edit.

Deletion must verify invitation ownership and Wish relationship.

## Gifts Dashboard

Reuse existing Gift Account domain logic from Task 09.

Dashboard may:

- display accounts
- add
- edit
- delete
- reorder

Do not duplicate a second Gifts business implementation.

Prefer reusing existing actions/validation/components or shared feature logic where appropriate.

Account number remains exact text and preserves leading zeroes.

## Settings

Settings scope for Task 14 should remain limited to already-supported couple/account/invitation settings.

Do not invent:

- password management flows not already supported
- notification system
- billing/subscription
- custom domain
- vendor settings
- analytics preferences

If no additional settings contract exists, provide a minimal settings shell/profile display rather than inventing features.

## Ownership Boundary

Every dashboard read/mutation must enforce:

authenticate
→ authenticated couple identity
→ owned invitation / child relationship

For child records, verify both child ID and invitation ID where applicable.

Do not rely only on frontend filters.

Cross-owner access must be rejected.

Never accept `coupleId` from client as authorization authority.

## Multiple Invitations

Every dashboard feature must remain invitation-scoped.

Do not assume one account = one invitation.

Guest, RSVP, Wishes, Gifts, preview, edit, and links must all operate against explicit owned `invitationId`.

## Invitation Status

Dashboard may display current status but must not arbitrarily mutate lifecycle.

Task 14 must not:

- create payment transaction
- mark payment paid
- set `payment_pending`
- activate invitation
- expire invitation
- calculate lifecycle dates

Those remain owned by payment/lifecycle tasks.

## Encryption Boundary

Invitee token crypto must be server-only.

Do not expose:

- `INVITEE_TOKEN_ENCRYPTION_KEY`
- encrypted token ciphertext
- token hash
- Supabase service credentials

to browser code.

Browser only receives the personal URL when authenticated owner explicitly requests Copy/Regenerate Link.

## Acceptance Criteria

- Couple dashboard requires authentication.
- Multiple owned invitations are supported.
- Cross-owner invitation access is rejected.
- Overview metrics are owner-scoped.
- Invitation list displays correct statuses.
- Edit/preview reuse existing builder/private preview.
- Guest CRUD works.
- Duplicate guest names are allowed.
- Guest tokens are cryptographically generated.
- Raw guest token is never stored plaintext.
- Copy Link works repeatedly without regeneration.
- Regenerate Link invalidates previous token.
- Cross-invitation guest mutations are rejected.
- RSVP summary correctly derives attending/not-attending/not-responded.
- Total attending guest count is correct.
- Wishes list is owner-scoped.
- Couple can delete owned Wishes only.
- Gifts reuse existing domain behavior.
- Settings does not invent unsupported functionality.
- No public invitee mutation is implemented.
- No payment/lifecycle mutation is implemented.

## Required Validation

- dashboard authentication tests
- multiple-invitation ownership tests
- cross-owner dashboard access tests
- overview owner-scoped aggregate tests
- invitation status presentation tests
- guest create/edit/delete tests
- duplicate guest-name test
- token entropy/generation tests
- SHA-256 token hash tests
- AES-GCM encrypt/decrypt tests
- raw token non-persistence tests
- copy-link repeatability tests
- regenerate-link invalidates old token tests
- foreign guest ID rejection
- cross-invitation guest rejection
- RSVP attending/not-attending/not-responded summary tests
- total attending guest-count tests
- Wishes owner-scoped read/delete tests
- cross-owner Wish deletion rejection
- Gifts reuse/regression tests
- settings-scope tests if needed
- no public RSVP/Wishes mutation tests
- no transaction/lifecycle mutation tests
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 14 files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 14 implementation and completion documentation.

Then STOP. Do not begin Task 15.
