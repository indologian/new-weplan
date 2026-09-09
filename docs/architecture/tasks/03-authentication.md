# Task 03 — Authentication

## Goal

Implement email/password, Google OAuth, profiles and protected routes.

## Depends On

02

## Required Context

- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/frontend/PROJECT-STRUCTURE.md`

Do not read unrelated reference documents.

## Allowed Paths

- `app/(auth)/**`
- `app/dashboard/**`
- `lib/supabase/**`
- `lib/auth/**`
- `proxy.ts`
- `actions/auth/**`
- `package.json`
- `package-lock.json`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria

Register/login/logout/OAuth work; couple cannot access admin; unauthenticated mutations rejected.

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

Then STOP. Do not begin Task 04.
