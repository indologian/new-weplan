# Task 08 — Builder Gallery

## Goal
Implement image and YouTube gallery with tier limits.

## Depends On
07

## Required Context
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/STORAGE.md`

Do not read unrelated reference documents.

## Allowed Paths
- `features/invitation-builder/**`
- `actions/**`
- `lib/storage/**`
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Server rejects media beyond resolved tier; image/youtube exclusivity is maintained.

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

Then STOP. Do not begin Task 09.
