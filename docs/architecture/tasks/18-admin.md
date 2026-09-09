# Task 18 — Admin

## Goal
Implement revenue/transactions/themes/tiers/invitations/homepage visibility.

## Depends On
17

## Required Context
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/SECURITY.md`

Do not read unrelated reference documents.

## Allowed Paths
- `app/dashboard/admin/**`
- `features/admin/**`
- `actions/admin/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Server role checks protect every admin mutation; homepage is toggle-only.

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

Then STOP. Do not begin Task 19.
