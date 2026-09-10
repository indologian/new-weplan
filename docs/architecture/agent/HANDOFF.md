# Agent Handoff

## Task

11 — Builder Music

## Completed

- Added strict server-side audio metadata validation for the approved MP3, M4A, OGG, and WAV MIME/extension combinations with a 9 MB maximum.
- Added authenticated, explicitly owned music state, signed upload, persistence, removal, and signed preview Server Actions.
- Derived every persisted destination server-side as `{coupleId}/{invitationId}/audio/background.{ext}`; arbitrary client paths are ignored.
- Verified the uploaded private Storage object and its metadata before persisting `invitations.music_path`.
- Kept same-extension replacement at the canonical object and safely cleaned the previous object after different-extension persistence.
- Preserved new authoritative music and returned a controlled warning when stale-object cleanup fails.
- Added retry-safe removal, including clearing valid owned references when the Storage object is already absent.
- Added one-hour temporary signed preview URLs without persisting them or changing bucket visibility.
- Added builder playback that never calls `play()` on render and starts only through the explicit preview button.
- Mounted the isolated Music form through the existing builder orchestration.

## Files created

- `actions/invitations/music.ts`
- `actions/invitations/music.test.ts`
- `actions/invitations/music-test-support.ts`
- `validations/music.ts`
- `validations/music.test.ts`
- `lib/storage/invitation-music.ts`
- `lib/storage/invitation-music.test.ts`
- `features/invitation-builder/components/music-form.tsx`
- `features/invitation-builder/utils/music-playback.ts`
- `features/invitation-builder/utils/music-playback.test.ts`

## Files changed

- `features/invitation-builder/components/identity-form.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies

None added or changed.

## Database, API, and Storage

- No migration, schema, RLS, grant, public API, bucket, or Storage-policy changes.
- Existing private `invitation-assets` bucket and nullable `invitations.music_path` remain authoritative.

## Tests and validation

- Focused Task 11 tests: pass, 4 files and 35 tests.
- Full `npm run test`: pass, 37 files and 203 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 42 files checked.
- Targeted read-only Biome: pass, 11 Task 11 implementation/integration files with zero diagnostics.
- `npm run build`: pass.
- Scoped `git diff --check`: pass.
- Credential, dependency, schema/RLS, actual-diff, and staged-scope reviews: pass.

## Known issues

None for Task 11.

## Blockers

None.

## Notes for next agent

- The database stores only the canonical private Storage path; signed upload/read URLs remain temporary.
- Task 11 performs strict metadata validation and does not add binary signature inspection or transcoding.
- Public invitation audio playback is not implemented and remains future scope.
- Existing user-owned changes in `docs/architecture/agent/CURRENT-TASK.md`, `docs/architecture/tasks/10-builder-interactions.md`, and `docs/architecture/tasks/11-builder-music.md` are excluded from the Task 11 commit.
- Task 12 has not been started. Do not begin it without explicit authorization.
