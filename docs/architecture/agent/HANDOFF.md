# Agent Handoff

## Task

08 — Builder Gallery

## Completed

- Added image and YouTube gallery CRUD with one combined deterministic order.
- Added server-side YouTube URL/video-ID normalization; only canonical 11-character video IDs are persisted and raw iframe/embed HTML is rejected.
- Added canonical private image paths: `{coupleId}/{invitationId}/gallery/{galleryItemId}.webp`.
- Added signed-upload preflight backed by a read-only capacity RPC. The browser never supplies tier, limit, owner, sort order, or persisted image path.
- Added post-upload object verification and atomic image persistence, including ambiguous-commit detection and compensating Storage cleanup after an uncommitted failure.
- Added canonical Storage cleanup before image row deletion; YouTube deletion performs no Storage mutation.
- Added exact full-set reorder validation for duplicate, missing, stale, and cross-invitation IDs.
- Added `SECURITY DEFINER` capacity and atomic-create RPCs with empty search paths, schema-qualified relations, explicit `auth.uid()` ownership authorization, restricted EXECUTE privileges, referenced inactive theme/tier entitlement resolution, and per-invitation transaction advisory locking.
- Mounted the Gallery form through the existing builder orchestration after Events and Stories.

## Files created

- `actions/invitations/gallery-errors.ts`
- `actions/invitations/gallery-image.ts`
- `actions/invitations/gallery-image.test.ts`
- `actions/invitations/gallery.ts`
- `actions/invitations/gallery.test.ts`
- `actions/invitations/gallery-test-support.ts`
- `features/invitation-builder/components/gallery-form.tsx`
- `lib/storage/gallery-image.ts`
- `lib/storage/gallery-image.test.ts`
- `validations/gallery.ts`
- `validations/gallery.test.ts`
- `validations/youtube-video.ts`
- `validations/youtube-video.test.ts`
- `supabase/migrations/20260910010000_task08_atomic_gallery_creation.sql`
- `supabase/tests/database/gallery-tier-limits.test.sql`
- `docs/architecture/database/gallery-functions.sql`

## Files changed

- `features/invitation-builder/components/identity-form.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies

None added or changed. A pinned PostgreSQL driver was installed only in an OS temporary directory to run remote pgTAP without Docker, then removed.

## Migration

- `20260910010000_task08_atomic_gallery_creation.sql`
  - `public.get_gallery_capacity(uuid)`
  - `public.create_gallery_item_atomic(uuid, uuid, text, text)`
- Applied successfully to the dedicated remote Supabase development project through the rotated Supavisor session-pooler credential.
- The remote project already contained the Task 02 schema but had an empty migration history. After verifying the required Task 02 tables, migration `20260909111837` was marked as already applied; Task 08 was then applied normally. Local and remote histories now match.
- No table schema or RLS policy was changed.

## Tests and validation

- Focused Task 08 tests: pass, 5 files and 32 tests.
- Full `npm run test`: pass, 28 files and 136 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 40 files checked.
- Targeted read-only Biome: pass, 14 Task 08 application files with zero diagnostics.
- `npm run build`: pass.
- Remote Task 08 pgTAP: pass, 28 assertions with zero failures.
- Existing remote ownership/security pgTAP regression: pass, 17 assertions with zero failures.
- Real two-session concurrency validation: pass. With one Basic image slot remaining, two simultaneous atomic creates produced one committed row and one `gallery_image_limit_reached`; final image count was exactly 4.
- Remote Supabase Security Advisor: pass, no warning/error findings.
- Remote migration history: local and remote versions match for Task 02 and Task 08.

## Security validation

- Both RPCs are `SECURITY DEFINER` with `search_path = ''` and schema-qualified table/function references.
- `PUBLIC` and `anon` have no EXECUTE; only `authenticated` is granted EXECUTE.
- Unauthenticated and foreign-owner calls are rejected.
- Capacity returns only the four approved limit/count fields.
- Basic/Premium/VIP exact limits succeed and limit + 1 fails.
- Inactive referenced themes and tiers retain the existing invitation entitlement.
- Atomic RPC arguments contain no owner, tier, limit, image path, or sort-order bypass inputs.
- Database `gallery_items` exclusivity remains enforced.

## Known issues

None for Task 08.

## Blockers

None.

## Notes for next agent

- Capacity preflight is UX-only; `create_gallery_item_atomic` remains the final authority after upload.
- Image and YouTube items intentionally share one `sort_order` sequence.
- Existing user-owned changes in `docs/architecture/agent/CURRENT-TASK.md` and `docs/architecture/tasks/08-builder-gallery.md` are excluded from the Task 08 commit.
- Task 09 has not been started. Do not begin it without explicit authorization.
