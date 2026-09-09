# Task 01 — Foundation

## Goal
Set up the project foundation and design system.

## Depends On
None

## Required Context
- `docs/architecture/frontend/PROJECT-STRUCTURE.md`
- `docs/architecture/reference/DESIGN-SYSTEM.md`

Do not read unrelated reference documents.

## Allowed Paths
- `app/**`
- `components/**`
- `styles/**`
- `lib/supabase/**`
- `package.json`
- `tsconfig.json`
- `next.config.*`
- `proxy.ts`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Build/lint/typecheck pass; no `src/`; semantic design tokens wired; Supabase client/server/admin boundaries stubbed safely.

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

Then STOP. Do not begin Task 02.
