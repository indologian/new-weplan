# Task 15 — Public Invitation

## Goal
Implement token/lifecycle validation, signed assets, view model and theme render.

## Depends On
14

## Required Context
- `docs/architecture/reference/THEME-SYSTEM.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/SECURITY.md`

Do not read unrelated reference documents.

## Allowed Paths
- `app/invitation/**`
- `themes/**`
- `lib/storage/**`
- `lib/invitations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Valid active link renders; invalid token/slug/expired link rejected; no raw token logged.

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

Then STOP. Do not begin Task 16.
