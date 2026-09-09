# Task 07 — Builder Story

## Goal

Implement Couple Story CRUD, reorder, and optional story image.

## Depends On

06

## Required Context

- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/database/schema.sql` — read-only, only the `stories` table definition and directly related constraints/indexes.

Do not read unrelated reference documents or unrelated database tables.

## Allowed Paths

- `features/invitation-builder/**`
- `actions/**`
- `lib/storage/**`
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, future task, schema/RLS, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

`docs/architecture/database/schema.sql` is read-only context and must not be modified.

## Story Contract

Each story item contains:

- `title`
- `storyDate` nullable
- `description`
- `imagePath` nullable
- `sortOrder`

A story may have at most one optional image.

## Acceptance Criteria

- Couple can create multiple story items.
- Couple can edit a story item.
- Couple can delete a story item.
- Couple can reorder story items.
- Story date is optional.
- Story image is optional.
- All mutations enforce authenticated invitation ownership.
- Story IDs from another invitation cannot be updated, deleted, or reordered.
- Ordering is deterministic and server-authoritative.
- Optional image follows the private Storage architecture.

## Required Validation

- focused validation/unit tests
- CRUD integration tests
- ownership negative tests
- cross-invitation story ID rejection
- reorder tests
- duplicate/foreign reorder ID rejection
- optional date tests
- optional image tests
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for Task 07 files not covered by standard lint
- `npm run build`
- scoped `git diff --check`
- scope/unrelated-change review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Commit only Task 07 implementation and completion documentation.

Then STOP. Do not begin Task 08.
