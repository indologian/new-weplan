# Agent Handoff

## Task

13 — Storage Hardening

## Completed

- Created and remotely applied the private `invitation-assets` bucket with a 10 MiB infrastructure limit and the approved WebP/audio MIME allowlist.
- Added authenticated `SELECT`, `INSERT`, `UPDATE`, and `DELETE` Storage policies that require both the caller UUID path segment and database-backed invitation ownership.
- Restricted policies to the approved canonical photo, story, gallery, and music paths; malformed and arbitrary owned subtrees are denied.
- Centralized invitation validation/ownership, canonical-path authorization, signed upload generation, and batch signed-read generation.
- Added post-upload image metadata verification for canonical path, object existence, `image/webp`, and optimized size at or below 500 KiB. This is metadata verification, not byte-level inspection.
- Hardened the existing browser compressor to reject a Blob whose reported MIME is not WebP while retaining the 10 MiB input, 1920px dimension, bounded compression, and 500 KiB output contracts.
- Added server-only cleanup primitives for canonical objects, batches, compensating cleanup, and paginated invitation-prefix cleanup using trusted owner/invitation identifiers.
- Migrated photo, Story, Gallery, Music, and private review Storage operations to the shared boundaries without changing domain-specific authorization, entitlement, atomic persistence, replacement, or preview behavior.
- Preserved Gallery committed-result detection before compensating cleanup and Music new-path authority when stale cleanup fails.

## Files created

- `lib/storage/authorized-assets.ts`
- `lib/storage/authorized-assets.test.ts`
- `lib/storage/image-metadata.ts`
- `lib/storage/image-metadata.test.ts`
- `lib/storage/cleanup.ts`
- `lib/storage/cleanup.test.ts`
- `supabase/migrations/20260911113524_task13_storage_hardening.sql`
- `supabase/tests/database/storage-security.test.sql`

## Files changed

- `actions/invitations/upload.ts`
- `actions/invitations/upload.test.ts`
- `actions/invitations/story-image.ts`
- `actions/invitations/story-image.test.ts`
- `actions/invitations/story-test-support.ts`
- `actions/invitations/stories.ts`
- `actions/invitations/stories.test.ts`
- `actions/invitations/gallery-image.ts`
- `actions/invitations/gallery-image.test.ts`
- `actions/invitations/gallery-test-support.ts`
- `actions/invitations/gallery.ts`
- `actions/invitations/gallery.test.ts`
- `actions/invitations/music.ts`
- `actions/invitations/music.test.ts`
- `actions/invitations/review.ts`
- `actions/invitations/review.test.ts`
- `features/invitation-builder/utils/image.ts`
- `features/invitation-builder/utils/image.test.ts`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies

None added or changed. Temporary PostgreSQL inspection tooling remained outside the repository.

## Database and Storage

- Migration `20260911113524_task13_storage_hardening.sql` was applied atomically and recorded in migration history on the dedicated remote Supabase development project.
- `invitation-assets` is private, has a `10485760` byte bucket limit, and contains only the approved MIME allowlist.
- Four policies target only `authenticated`; `anon` receives no policy. `UPDATE` has both `USING` and `WITH CHECK`.
- Ownership requires canonical first segment = `auth.uid()` and second segment = an invitation whose `couple_id = auth.uid()`.
- No business schema, domain RLS, payment, invitee/public flow, or dependency was changed.

## Tests and validation

- Focused Task 13 application/Storage regressions: pass, 16 files and 86 tests.
- Full `npm run test`: pass, 48 files and 241 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 54 standard-scope files checked.
- Targeted read-only Biome: pass, 24 Task 13 application files with zero diagnostics.
- `npm run build`: pass.
- Remote Task 13 Storage pgTAP: pass, 21 assertions.
- Existing remote ownership pgTAP: pass, 17 assertions.
- Existing remote Gallery security/entitlement pgTAP: pass, 28 assertions.
- Remote Storage API integration: pass, 16 checks covering owner CRUD, anon denial, foreign-owner denial, canonical ownership, arbitrary subtree rejection, move boundary, and effective deletion.
- Post-test fixture cleanup verification: pass; no Task 13 auth, theme, or Storage fixtures remain.
- Supabase Security Advisor could not be queried because the connected MCP identity lacks project permission.

## Known issues

- Stored image verification checks Storage object existence, size, and MIME metadata only. It does not claim byte-level WebP verification; server downloads or binary parsing would require a separate architecture decision.
- The Supabase Security Advisor connector remains unavailable to the connected identity.

## Blockers

None for Task 13.

## Notes for next agent

- `cleanupOwnedInvitationAssets` is the owner-facing cleanup entry and verifies ownership before privileged prefix cleanup. `cleanupTrustedInvitationAssets` is server-only and accepts trusted lifecycle identifiers, never a browser-supplied path or prefix.
- Signed URLs remain temporary presentation values and are not persisted.
- Existing user-owned changes in `docs/architecture/agent/CURRENT-TASK.md` and Task 10–13 documents are excluded from the Task 13 commit.
- Do not begin Task 14 without explicit authorization.
