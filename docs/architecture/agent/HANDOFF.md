# Agent Handoff

## Task

06 — Builder Events

## Completed

- Added the architecture-defined event contract and server-side validation for dates, text-based times, paired coordinates, and coordinate ranges.
- Added authenticated multi-event create, read, update, and delete actions with invitation ownership checks.
- Bound update, delete, set-main, and reorder operations to both event ID and invitation ID.
- Normalized `end_time` to `null` server-side whenever `until_finished` is true.
- Added deterministic, server-authoritative sequential ordering and rejection of duplicate, incomplete, or foreign event ID lists.
- Added main-event switching that unsets the current main event before setting the verified target event.
- Added a separate event editor with multiple locations/times, create/edit/delete, reorder controls, and main-event radio selection.
- Integrated the Task 06 editor into the existing builder only after a persistent invitation ID is available.

## Files created

- `actions/invitations/events.ts`
- `actions/invitations/events.test.ts`
- `validations/event.ts`
- `validations/event.test.ts`
- `features/invitation-builder/components/events-form.tsx`

## Files changed

- `features/invitation-builder/components/identity-form.tsx`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Dependencies

None added or changed.

## Migrations

None. Existing `public.wedding_events` schema, ownership RLS, and partial unique index `one_main_event_per_invitation` remain unchanged.

## Tests and validation

- Focused Task 06 tests: pass, 2 files and 20 tests.
- Full `npm run test`: pass, 19 files and 86 tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 36 files checked.
- Targeted read-only Biome check: pass, 6 Task 06 files checked with zero diagnostics.
- `npm run build`: pass.
- Scoped `git diff --check`: pass; only a Git line-ending notice was emitted.
- Credential and dependency/schema scope checks: pass.

## Known issues

- Set-main uses the safest available server sequence: unset the existing main event, then set the verified target. The operations are not atomic because Task 06 does not authorize an RPC/database function. The existing partial unique index remains final race protection; unique-write failures are returned as controlled generic errors.
- External dirty files `.gitignore`, `.env.example`, `docs/architecture/agent/CURRENT-TASK.md`, and `docs/architecture/tasks/06-builder-events.md` were explicitly excluded from validation staging and the Task 06 commit.

## Blockers

None.

## Notes for next agent

- Event time values intentionally remain text in persistence.
- An invitation may temporarily have zero main events while being edited, but never more than one.
- Reorder requires the complete event ID set for the owned invitation and persists normalized order `0..n-1`.
- Task 07 has not been started. Do not begin it without explicit authorization.
