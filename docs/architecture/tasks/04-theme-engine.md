# Task 04 — Theme Engine

## Goal
Implement common theme contract, registry and one complete reference theme.

## Depends On
03

## Required Context
- `docs/architecture/reference/THEME-SYSTEM.md`
- `docs/architecture/reference/DESIGN-SYSTEM.md`

Do not read unrelated reference documents.

## Allowed Paths
- `themes/**`
- `types/**`
- `app/(public)/themes/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
renderer_key allowlist resolves a theme without route hardcoding; reference theme renders common view model.

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

Then STOP. Do not begin Task 05.
