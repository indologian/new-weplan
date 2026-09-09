# Task 14 — Couple Dashboard

## Goal
Implement overview, invitations, guests, RSVP, wishes, gifts and settings.

## Depends On
13

## Required Context
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/SECURITY.md`

Do not read unrelated reference documents.

## Allowed Paths
- `app/dashboard/couple/**`
- `features/**`
- `actions/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Multiple invitations supported; guest copy/regenerate link works; ownership isolation passes.

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

Then STOP. Do not begin Task 15.
