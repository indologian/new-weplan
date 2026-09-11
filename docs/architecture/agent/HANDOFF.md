# Agent Handoff

## Task

14 — Couple Dashboard

## Completed

- Replaced the placeholder couple page with an authenticated dashboard covering Overview, Invitations, Guests, RSVP, Wishes, Gifts, and Settings.
- Added owner-scoped multi-invitation reads and global overview aggregates without querying or mutating transactions.
- Reused existing builder resume/private preview navigation, Task 09 Gifts, and Task 10 Interaction Config.
- Added guest create, rename, delete, Copy Link, and Regenerate Link actions with explicit invitation and child ownership checks.
- Added 256-bit URL-safe guest tokens, SHA-256 lookup hashes, and AES-256-GCM encrypted recovery using a fail-closed server-only Base64 key.
- Copy Link is repeatable and read-only. Regenerate replaces hash and ciphertext in one row update, making the previous hash non-authoritative.
- Added owner-scoped Wishes presentation/deletion and deterministic RSVP summaries derived from guests and persisted RSVP rows.

## Files created

- `actions/dashboard/dashboard.ts`
- `actions/dashboard/dashboard.test.ts`
- `actions/dashboard/dashboard-test-support.ts`
- `actions/dashboard/shared.ts`
- `actions/dashboard/guests.ts`
- `actions/dashboard/guests.test.ts`
- `actions/dashboard/wishes.ts`
- `actions/dashboard/wishes.test.ts`
- `features/couple-dashboard/components/couple-dashboard.tsx`
- `features/couple-dashboard/components/dashboard-navigation.tsx`
- `features/couple-dashboard/components/overview-section.tsx`
- `features/couple-dashboard/components/invitations-section.tsx`
- `features/couple-dashboard/components/invitations-section.test.tsx`
- `features/couple-dashboard/components/guests-section.tsx`
- `features/couple-dashboard/components/rsvp-section.tsx`
- `features/couple-dashboard/components/wishes-section.tsx`
- `features/couple-dashboard/components/settings-section.tsx`
- `lib/dashboard/authorization.ts`
- `lib/dashboard/invitee-token.ts`
- `lib/dashboard/invitee-token.test.ts`
- `validations/dashboard.ts`
- `validations/dashboard.test.ts`

## Files changed

- `app/dashboard/couple/page.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies, database, and Storage

- No dependency or lockfile changes.
- No schema, migration, RLS, grant, RPC, bucket, or Storage changes.
- No public invitee, public RSVP/Wishes, payment, transaction, or invitation lifecycle mutation was added.

## Tests and validation

- Focused Task 14 plus Task 09/10/12 regressions: pass, 10 files and 53 tests.
- Full `npm run test`: pass, 54 files and 269 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 57 standard-scope files checked.
- Targeted read-only Biome: pass, 23 Task 14 implementation files.
- `npm run build`: pass.
- Scoped diff, credential, dependency, schema/RLS, and staged-file reviews: pass.

## Known issues

- The standard lint script does not include every Task 14 source directory; all Task 14 implementation files are additionally covered by targeted read-only Biome.

## Blockers

None.

## Notes for next agent

- `INVITEE_TOKEN_ENCRYPTION_KEY` must be valid Base64 decoding to exactly 32 bytes; there is no fallback key.
- Guest personal links are returned as application-relative paths and raw tokens are never persisted or logged.
- Existing user-owned changes in `CURRENT-TASK.md` and Task 10–14 documents remain untouched and excluded from this commit.
- Do not begin Task 15 without explicit authorization.
