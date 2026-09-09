# Task 12 — Builder Review & Preview

## Goal
Implement authenticated private review/preview and checkout CTA boundary.

## Depends On
11

## Required Context
- `docs/architecture/reference/THEME-SYSTEM.md`
- `docs/architecture/reference/PAYMENT.md`

Do not read unrelated reference documents.

## Allowed Paths
- `features/invitation-builder/**`
- `app/create/**`
- `themes/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Preview is not public URL; user can navigate back/edit; CTA passes only invitationId to checkout boundary.

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

Then STOP. Do not begin Task 13.
