# Task 11 — Builder Music

## Goal
Implement one background audio configuration/upload flow.

## Depends On
10

## Required Context
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
One audio file, <=9MB allowlist, server authorization; preview requires user gesture before play.

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

Then STOP. Do not begin Task 12.
