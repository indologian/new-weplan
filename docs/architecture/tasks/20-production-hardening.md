# Task 20 — Production Hardening

## Goal
Run scoped audits; fix only findings explicitly accepted into this task.

## Depends On
19

## Required Context
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/PAYMENT.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/implementation/MILESTONES.md`

Do not read unrelated reference documents.

## Allowed Paths
- `**/*`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
No unresolved critical/high docs/architecture/security/payment/data-integrity findings; mobile/performance/accessibility and backup restore drill recorded.

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

Then STOP. Do not begin Task 21.
