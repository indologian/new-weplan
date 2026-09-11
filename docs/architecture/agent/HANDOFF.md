# Agent Handoff

## Task

15 — Public Invitation

## Completed

- Added the public route `/invitation/[slug]/[guestToken]` with generic safe not-found handling.
- Added server-only guest-token validation and SHA-256 hashing; raw guest tokens are neither persisted nor logged by the public flow.
- Added a narrow privileged-read boundary after token validation, followed by exact invitation slug and lifecycle checks before child data or signed assets are loaded.
- Resolved renderer keys exclusively through the existing allowlisted theme registry.
- Built a sanitized public invitation view model with personalized guest data, deterministic child ordering, safe map links, and no database ownership identifiers exposed to the renderer.
- Reused centralized canonical Storage authorization and batch signed reads with a one-hour TTL; signed URLs are ephemeral and are not persisted.
- Added explicit-user-gesture background-music playback without autoplay.
- Kept RSVP and Wishes read-only: persisted wishes can be displayed, while no public mutation endpoint or form was introduced.

## Files created

- `app/invitation/_components/public-invitation-renderer.tsx`
- `app/invitation/_components/public-invitation-renderer.test.tsx`
- `app/invitation/[slug]/[guestToken]/page.tsx`
- `app/invitation/[slug]/[guestToken]/not-found.tsx`
- `lib/invitations/public-invitation.ts`
- `lib/invitations/public-invitation.test.ts`
- `lib/invitations/public-invitation-test-support.ts`
- `lib/invitations/public-view-model.ts`
- `lib/invitations/public-view-model.test.ts`
- `lib/storage/public-invitation-assets.ts`
- `lib/storage/public-invitation-assets.test.ts`

## Files changed

- `themes/types.ts`
- `themes/elegant-green/index.tsx`
- `themes/elegant-green/sections/maps.tsx`
- `themes/elegant-green/sections/wishes.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Authorization and security boundary

- Public input is limited to a validated slug and 43-character URL-safe guest token.
- The token is hashed before lookup; the guest query selects only `invitation_id` and `name`.
- The server-only privileged client is used only after input validation and never reaches client code.
- Invitation status must be `active`, and `expires_at` must be later than the server time.
- Unknown tokens, slug mismatches, inactive or expired invitations, unknown renderers, and failed loads all produce the same safe not-found outcome.
- Canonical persisted asset paths are verified before signing. Missing individual Storage objects degrade to absent media rather than exposing Storage errors.

## Dependencies, database, and Storage

- No dependency or lockfile changes.
- No schema, migration, RLS, policy, grant, RPC, bucket, or Storage configuration changes.
- No public RSVP/Wishes mutation, transaction, payment, dashboard, builder, or invitation lifecycle mutation was added.

## Tests and validation

- Focused Task 15 tests: pass, 11 files and 42 tests.
- Full `npm run test`: pass, 58 files and 291 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 68 standard-scope files checked.
- Targeted read-only Biome: pass, 16 Task 15 files.
- `npm run build`: pass; `/invitation/[slug]/[guestToken]` is included in the production route output.
- Scoped diff, credential, dependency, schema/RLS, and staged-file reviews: pass.

## Known issues

- The standard lint script does not include every Task 15 source directory; all Task 15 implementation files are additionally covered by targeted read-only Biome.

## Blockers

None.

## Notes for next agent

- The public loader intentionally uses the architecture-authorized server-only privileged boundary because anonymous Data API access to invitation and guest records is denied by RLS.
- Public music playback starts only from the theme's explicit Open Invitation gesture.
- Existing user-owned changes in `CURRENT-TASK.md` and Task 10–15 documents remain untouched and excluded from this commit.
- Do not begin Task 16 without explicit authorization.
