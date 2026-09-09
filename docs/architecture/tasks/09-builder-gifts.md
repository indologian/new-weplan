# Task 09 — Builder Gifts

## Goal
Implement multiple bank gift accounts and copy-friendly presentation data.

## Depends On
08

## Required Context
- `docs/architecture/reference/DATABASE.md`

Do not read unrelated reference documents.

## Allowed Paths
- `features/invitation-builder/**`
- `actions/**`
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
CRUD/reorder works; account number remains text; ownership enforced.

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

Then STOP. Do not begin Task 10.
