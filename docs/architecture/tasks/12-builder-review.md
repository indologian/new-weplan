# Task 12 — Builder Review & Preview

## Goal

Implement authenticated private review and invitation preview for the builder, with trusted commercial summary and a strict checkout boundary.

## Depends On

11

## Required Context

- `docs/architecture/reference/THEME-SYSTEM.md`
- `docs/architecture/reference/PAYMENT.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only definitions directly required for:
  - `invitations`
  - `themes`
  - `tiers`
  - `wedding_events`
  - `stories`
  - `gallery_items`
  - `gift_accounts`

Do not read unrelated reference documents or unrelated database tables.

Architecture/database files are read-only and must not be modified.

## Allowed Paths

- `features/invitation-builder/**`
- `app/create/**`
- `themes/**`
- `actions/invitations/**`
- `lib/storage/**`
- `types/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, future task, payment implementation, schema/RLS, dependency, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

## Review Contract

Review page must display trusted data for the current owned invitation, including at minimum:

- selected theme
- tier
- active duration
- price
- invitation content summary
- preview action
- edit/back navigation
- checkout CTA boundary

Theme/tier/price/duration must be resolved server-side.

Do not accept trusted:

- theme name
- tier
- price
- active duration
- owner ID

from client state.

Resolution:

`owned invitation`
→ `theme`
→ `tier`
→ current price/duration display

This is review-time display only.

Payment transaction snapshot is NOT created in Task 12.

## Private Preview

Preview is authenticated and private.

It must NOT use the public invitation route:

`/invitation/[slug]/[guestToken]`

Task 12 must not create, simulate, or bypass invitee tokens.

Preview must require:

1. authenticated user;
2. invitation ownership;
3. owned invitation data load;
4. private asset access authorized for that owner;
5. render using the selected theme renderer.

Unauthorized/cross-owner preview must be rejected.

## Preview Route

Use a builder-owned route under `app/create/**`, for example an invitation-specific review/preview route compatible with the existing builder structure.

The exact route may follow the current implementation pattern, but must remain private and must not conflict with the public invitation URL.

Do not expose a public preview token.

## Theme Rendering

Preview should reuse the existing Theme System:

invitation theme
→ `renderer_key`
→ allowlisted theme registry
→ React renderer

Do not duplicate theme layouts inside builder components.

Do not add route-level hardcoded renderer switches.

If current theme ViewModel needs minimal adaptation for persisted builder data, changes inside `types/**` / `themes/**` are allowed only when required for this preview and must preserve Task 04 behavior.

## Preview Data

Build the preview ViewModel from persisted invitation data.

Do not rely on fixture/mock invitation content for the authenticated builder preview.

Relevant persisted content may include:

- identity/opening/prayer
- wedding events
- stories
- gallery/video
- gifts
- RSVP/Wishes config
- music

Task 12 does not create/edit these records; it only reads and presents existing builder state.

## Private Assets

Supabase Storage remains private.

For preview media/audio:

- verify authenticated ownership first;
- generate temporary signed read URLs;
- do not persist signed URLs;
- do not convert the bucket to public.

Prefer batch signed-URL generation for multiple assets where existing Storage utilities support it.

Preview must not use raw private Storage paths as browser URLs.

## Music Preview

Reuse Task 11 user-gesture playback behavior.

Opening/rendering preview must not automatically start audio.

Music may start only after explicit user interaction.

Do not implement public invitation music behavior.

## Edit / Back Navigation

Review must allow couple to return to builder sections for editing.

Navigation must not:

- create duplicate invitation;
- reset persisted data;
- bypass ownership;
- create payment transaction.

Task 12 does not require redesigning all previous builder steps.

## Checkout CTA Boundary

CTA may be labeled similar to:

`Bayar & Publish`

But Task 12 must NOT implement Midtrans checkout.

The CTA boundary may pass only:

`invitationId`

to the future payment layer.

Do not pass from client as trusted values:

- price
- tier
- theme ID
- active months
- transaction status
- Midtrans order ID

Task 17 will resolve commercial data again server-side and create the transaction snapshot.

If no payment endpoint/action exists yet, implement a safe boundary/placeholder that does not fake payment success or activate the invitation.

## Invitation Lifecycle

Task 12 must not:

- change invitation to `payment_pending`;
- activate invitation;
- set `paid_at`;
- set `published_at`;
- calculate `expires_at`;
- create transaction rows.

Those belong to Task 17.

Review/preview must work for the builder's eligible pre-payment state without inventing payment behavior.

## Acceptance Criteria

- Review is accessible only to authenticated invitation owner.
- Cross-owner review/preview is rejected.
- Preview is not exposed through the public invitee URL.
- Preview renders persisted invitation content through the selected theme renderer.
- Private media uses temporary authorized URLs.
- Signed URLs are not persisted.
- Music preview does not autoplay.
- Review displays server-resolved theme, tier, current duration, and current price.
- User can navigate back/edit without losing persisted invitation data.
- Checkout CTA boundary passes only `invitationId`.
- Task 12 does not create payment transaction or activate invitation.
- No fixture invitation data is used as source of truth for authenticated preview.

## Required Validation

- authenticated owner review test
- unauthenticated review rejection
- cross-owner review rejection
- server-resolved theme/tier/price/duration tests
- theme registry preview-render test
- persisted content → preview ViewModel test
- private signed asset URL tests
- signed URL non-persistence test
- no public invitee-token dependency test
- music no-autoplay test
- edit/back navigation test
- checkout boundary only exposes/passes invitationId
- no transaction creation test
- no lifecycle activation/status mutation test
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 12 files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 12 implementation and completion documentation.

Then STOP. Do not begin Task 13.
