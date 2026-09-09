# Agent Handoff

## Task

05-builder-identity audit remediation

## Completed

- Centralized safe internal return-path validation for password auth, Google OAuth, and the OAuth callback, including encoded and backslash bypass protection.
- Reworked invitation photo authorization so the server validates ownership/type and calculates both signed-upload and persisted canonical paths.
- Stabilized the Supabase browser client used by `IdentityForm`.
- Replaced the ineffective slug timer with cancellable debounce, request abort, and stale-response protection.
- Implemented approved server-only privileged global slug existence lookup with validated input and minimal public output.
- Added server-side active-theme resolution before rendering the builder while retaining authoritative verification during persistent creation.
- Enforced image input <=10 MB, longest side <=1920px, WebP output, and iterative compression/resizing to <=500 KB.
- Added focused security, validation, storage, route, debounce, and image tests.

## Files created

- `actions/auth/safe-return.ts`
- `actions/auth/safe-return.test.ts`
- `actions/invitations/upload.test.ts`
- `app/api/invitations/slug-availability/route.test.ts`
- `app/create/[themeSlug]/page.test.tsx`
- `features/invitation-builder/utils/image.test.ts`
- `features/invitation-builder/utils/slug-availability.ts`
- `features/invitation-builder/utils/slug-availability.test.ts`
- `lib/storage/invitation-photo.ts`
- `lib/storage/invitation-photo.test.ts`
- `validations/invitation.test.ts`

## Files changed

- `actions/auth/actions.ts`
- `actions/invitations/create.ts`
- `actions/invitations/upload.ts`
- `app/(auth)/auth/callback/route.ts`
- `app/api/invitations/slug-availability/route.ts`
- `app/create/[themeSlug]/page.tsx`
- `features/invitation-builder/components/identity-form.tsx`
- `features/invitation-builder/utils/image.ts`
- `validations/invitation.ts`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies

None added or changed.

## Migrations

None. Database schema and RLS were not changed.

## Tests and validation

- Focused remediation tests: pass, 8 files and 39 tests.
- Full `npm run test`: pass, 11 files and 55 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 35 files checked.
- Targeted read-only Biome check for remediation files: pass, 17 files checked.
- `npm run build`: pass; Task 05 routes compiled.
- Scope audit: pass, zero changed files outside Task 05 Allowed Paths.
- Credential scan: pass, no credential or service-role token found.
- Schema/RLS diff: pass, no changes.
- `git diff --check`: pass; only Git line-ending notices were reported.

## Known issues

- The standard lint script omits some Task 05 directories. A targeted read-only Biome check was run for remediation files; changing the lint script is outside Task 05 Allowed Paths.
- Task 04 audit findings were intentionally not remediated in this Task 05-only change.

## Blockers

None.

## Notes for next agent

- The privileged client is restricted to the slug-availability Route Handler and selects only `slug` after validation; the response contains only `slug` and `available`.
- Database `UNIQUE` remains the final slug authority.
- Photo path persistence no longer accepts a client-provided path.
- Do not begin Task 06 until explicitly authorized and `CURRENT-TASK.md` is advanced.
