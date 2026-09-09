# Task 13 — Storage Hardening

## Goal
Finalize private bucket policies, signed uploads/reads, image optimization and cleanup service.

## Depends On
12

## Required Context
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/SECURITY.md`

Do not read unrelated reference documents.

## Allowed Paths
- `lib/storage/**`
- `supabase/**`
- `features/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
No public invitation bucket; arbitrary paths rejected; signed upload/read and idempotent cleanup tests pass.

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

Then STOP. Do not begin Task 14.
