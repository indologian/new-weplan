# Task 06 — Builder Events

## Goal
Implement multi-event CRUD, ordering and one main countdown event.

## Depends On
05

## Required Context
- `docs/architecture/reference/DATABASE.md`

Do not read unrelated reference documents.

## Allowed Paths
- `features/invitation-builder/**`
- `actions/invitations/**`
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Multiple locations/times work; DB/server enforce at most one main event.

## Required Validation
- relevant automated/unit/integration tests
- `typecheck`
- `lint`
- build when appropriate
- docs/architecture/security/ownership negative tests when data access changes

## Completion Output
Update:
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Then STOP. Do not begin Task 07.
