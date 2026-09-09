# Task 02 — Database & Security

## Goal
Create reproducible migrations, constraints, indexes and RLS.

## Depends On
01

## Required Context
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/database/schema.sql`
- `docs/architecture/database/indexes.sql`
- `docs/architecture/database/rls-policies.sql`
- `docs/architecture/database/seed.sql`

Do not read unrelated reference documents.

## Allowed Paths
- `supabase/**`
- `docs/architecture/database/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Database Validation Environment

Preferred:
- Local Supabase.

Official fallback for Weplan:
- Dedicated remote Supabase development project.

Rules:
- The remote Supabase project must be used only for development/testing.
- Never run destructive database validation against production.
- Never use production data for migration/reset testing.
- Never hardcode or commit database passwords, connection strings, service-role keys, or other credentials.
- If local Supabase is unavailable, use the dedicated remote development Supabase project.
- The absence of Docker/local Supabase alone is not a BLOCKER when the dedicated remote development Supabase project is available.

## Acceptance Criteria
- Fresh database can be created from the migrations.
- All migrations can be applied successfully from a clean database state.
- Required seed data can be applied successfully.
- Ownership isolation tests pass.
- Admin boundary tests pass.
- RLS policies behave according to the architecture specification.

Validation may be performed using either:
1. Local Supabase; or
2. Dedicated remote Supabase development project.

Production must never be used for destructive validation.

## Required Validation
- Apply all migrations from a clean database state.
- Apply required seed data.
- Run relevant database/pgTAP tests.
- Run ownership isolation negative tests.
- Run admin boundary negative tests.
- Run RLS access tests.
- Run relevant automated/unit/integration tests.
- Run `typecheck`.
- Run `lint`.
- Run build when appropriate.

If database validation cannot run locally because Docker/local Supabase is unavailable, use the dedicated remote Supabase development project.

Only report a database-environment `BLOCKER` when neither local Supabase nor the dedicated remote Supabase development project is available.

## Completion Output
Update:
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Record which validation environment was used:
- `local`, or
- `remote-development`.

Include the migration and database test results in the handoff.

Then STOP. Do not begin Task 03.
