# Task 05 — Builder Identity

## Goal

Implement Step 1, local pre-auth draft, auth gate, draft creation and identity fields.

## Depends On

04

## Required Context

- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/DESIGN-SYSTEM.md`

Do not read unrelated reference documents.

## Allowed Paths

- `app/create/**`
- `app/api/invitations/slug-availability/**`
- `app/(auth)/**`
- `features/invitation-builder/**`
- `actions/invitations/**`
- `actions/auth/**`
- `validations/**`
- `lib/storage/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria

Guest can fill text; auth required before persistent draft/upload; slug validation/availability and server uniqueness handling exist.

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

Then STOP. Do not begin Task 06.
