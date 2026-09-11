# Task 15 — Public Invitation

## Goal

Implement secure public invitation rendering using invitee token validation, invitation lifecycle validation, private signed assets, safe public view-model mapping, and allowlisted theme rendering.

## Depends On

14

## Required Context

- `docs/architecture/reference/THEME-SYSTEM.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only definitions directly related to:
  - `invitations`
  - `invitation_guests`
  - `wedding_events`
  - `stories`
  - `gallery_items`
  - `gift_accounts`
  - `rsvps`
  - `wishes`

Do not read unrelated reference documents or unrelated database tables.

Architecture/database files are read-only context and must not be modified.

## Allowed Paths

- `app/invitation/**`
- `themes/**`
- `lib/storage/**`
- `lib/invitations/**`
- `types/**` only when minimal public-view-model adaptation is required
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, public RSVP/Wishes mutation, payment flow, admin/couple dashboard, schema/RLS, dependency, future task, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

## Public Route

Public invitation route:

`/invitation/[slug]/[guestToken]`

Both values come from URL input and must be treated as untrusted.

Do not authorize using slug alone.

Do not authorize using guest name.

Do not expose a preview/public bypass route.

## Token Validation

Incoming raw `guestToken` must never be queried directly against plaintext persistence.

Validation flow:

1. validate route parameters;
2. hash incoming token using SHA-256;
3. lookup `invitation_guests.guest_token_hash`;
4. verify the guest belongs to the invitation being requested;
5. verify route slug equals the invitation's persisted slug.

Do not decrypt `guest_token_encrypted` for public access.

Public lookup uses hash only.

Do not log:

- raw guest token;
- encrypted guest token;
- token hash;
- full personalized invitation URL.

## Lifecycle Validation

Invitation must satisfy all public-access conditions.

Required:

- `status = active`
- `expires_at IS NOT NULL`
- `expires_at > now()`

Reject:

- draft
- payment_pending
- expired
- active but already past `expires_at`
- malformed/missing lifecycle state

`delete_after` does not extend public access.

Grace period is cleanup retention only, not public viewing access.

## Slug Validation

Token must resolve to a guest belonging to one invitation.

Then persisted invitation slug must match the route slug exactly according to application slug normalization rules.

Valid token + wrong slug must fail.

Do not silently redirect wrong slug to the correct invitation because that reveals canonical invitation metadata from a valid token.

## Public Data Boundary

Build a dedicated safe public invitation data boundary.

Public renderer may receive presentation data required by the invitation theme.

Do not expose:

- `couple_id`
- profile/auth user ID
- guest database ID
- invitation database IDs unless strictly internal server-side
- token hash
- encrypted token
- raw token beyond route handling
- transaction data
- payment metadata
- private admin fields
- signed Storage paths
- server secrets

Public invitee context should expose only presentation-safe values.

## Invitee ViewModel

Renderer may receive invitee presentation context such as:

- display name
- values needed to personalize greeting
- `isMine`-style context only if required later

Do not include raw database guest ID/token material in public theme props.

Task 15 does not implement invitee mutation.

## Public Invitation ViewModel

Build the public ViewModel from persisted invitation content:

- identity
- opening greeting
- prayer
- main date/event
- events
- locations
- couple story
- gallery
- gifts
- RSVP/Wishes enabled flags
- music

Preserve deterministic ordering from persisted `sort_order`.

Do not use fixture/mock invitation data.

## RSVP / Wishes Data

Task 15 may render existing Wishes if the approved theme contract requires public display.

If existing Wishes are rendered, return safe public representation only, for example:

- name
- message
- createdAt

Do not expose:

- `guest_id`
- invitation guest token information
- internal database IDs

Task 15 must NOT implement:

- RSVP submission
- RSVP update
- Wish submission
- Wish editing

Those belong to Task 16.

If public Wishes rendering requires a data contract not covered by current Allowed Paths/types, report BLOCKER instead of leaking internal rows.

## Theme Rendering

Use:

persisted invitation
→ persisted theme
→ `renderer_key`
→ allowlisted theme registry
→ theme renderer

Do not select renderer from route input.

Unknown/unallowlisted renderer must fail safely.

Do not duplicate theme JSX inside public route.

## Private Assets

`invitation-assets` remains private.

After token + lifecycle validation:

- collect only canonical persisted paths belonging to the validated invitation;
- generate temporary signed read URLs;
- do not persist signed URLs;
- do not expose raw private paths as browser URLs.

Prefer existing Task 12/13 batch signed-read primitives.

Public signed-read authorization derives from successful invitee token + lifecycle validation, not authenticated couple ownership.

Do not loosen Storage bucket policy to make public invitation rendering work.

## Signed URL Lifetime

Use temporary signed URLs consistent with Storage architecture, approximately one hour unless existing hardened helper defines the canonical TTL.

Signed URL expiration does not determine invitation expiration.

Public lifecycle validation must occur on every invitation page request.

## Music

Public invitation music follows the browser user-gesture rule.

Do not autoplay on initial page load/render.

Music may start only after the invitee clicks:

`Open Invitation`

or an equivalent explicit user gesture.

Reuse Task 11/theme music behavior where possible.

Do not create a separate autoplay workaround.

## Open Invitation

The opening cover should:

- render before main invitation content interaction;
- personalize invitee presentation if theme supports it;
- on explicit click, reveal/open invitation;
- allow music to start only after that gesture.

Task 15 should not create authentication/session for invitee.

## Maps

Render Maps from persisted latitude/longitude data.

Do not persist or render arbitrary iframe HTML from database.

Use the architecture-approved maps presentation mechanism.

If current implementation requires an API/config addition outside Allowed Paths, report BLOCKER.

## Error Behavior

Invalid public invitations should fail safely.

Cases:

- malformed token
- token not found
- token belongs to another invitation
- wrong slug
- invitation not active
- invitation expired
- unknown renderer

should not reveal detailed distinction to unauthenticated clients if that distinction would aid enumeration.

Use generic not-found/unavailable behavior.

Do not reveal whether a particular guest name/token exists.

## Abuse / Logging

Do not log raw route guest tokens.

Avoid including personalized token URLs in structured application logs.

Expected invalid-token traffic should produce controlled failures, not raw database exceptions.

Task 15 does not introduce CAPTCHA/rate-limit infrastructure unless already available in scope.

## Acceptance Criteria

- Valid personalized link renders the active invitation.
- Unauthenticated browser can access a valid public invitation link.
- Valid token + correct slug + active/non-expired invitation succeeds.
- Invalid token is rejected.
- Valid token + wrong slug is rejected.
- Token belonging to another invitation is rejected.
- Draft invitation is rejected.
- Payment-pending invitation is rejected.
- Expired invitation is rejected.
- Active invitation with `expires_at <= now()` is rejected.
- Grace-period invitation content remains inaccessible.
- Public access uses SHA-256 token lookup, not token decryption.
- Raw guest token is not logged or persisted.
- Public renderer uses persisted content, not fixtures.
- Theme renderer is resolved through allowlisted `renderer_key`.
- Private assets use temporary signed URLs.
- Raw Storage paths are not public browser URLs.
- Signed URLs are not persisted.
- Public ViewModel does not expose token material, couple IDs, or private metadata.
- Music does not autoplay before explicit user gesture.
- Task 15 does not implement public RSVP/Wishes mutations.

## Required Validation

- valid token + slug + active invitation test
- invalid token test
- wrong slug test
- cross-invitation token test
- draft rejection
- payment-pending rejection
- expired-status rejection
- active-but-time-expired rejection
- grace-period access rejection
- SHA-256 token lookup test
- proof public flow does not decrypt stored guest token
- raw-token non-logging test
- persisted-data → public ViewModel test
- safe invitee ViewModel test
- no sensitive ID/token-field exposure test
- theme registry render test
- unknown renderer safe rejection
- private signed-read tests
- signed URL non-persistence test
- raw private path non-exposure test
- public music no-autoplay test
- Open Invitation gesture test
- public Wishes safe mapping tests if Wishes are rendered
- no public RSVP mutation test
- no public Wish mutation test
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 15 files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 15 implementation and completion documentation.

Then STOP. Do not begin Task 16.
