# Backup & Restore SOP

## Before a major migration
1. Freeze schema-changing work.
2. Record current migration/version.
3. Export PostgreSQL schema + data using standard PostgreSQL/Supabase-supported tooling available to the operator.
4. Store backup outside the production database with restricted access.
5. Record checksum/date/environment.
6. Apply migration to staging first.

## Restore drill
1. Never test restore directly on production.
2. Provision an isolated restore target.
3. Restore schema/data.
4. Verify row counts for critical tables.
5. Verify transaction history and invitation relationships.
6. Run auth/RLS smoke tests.
7. Record result.

## Production restore
Requires explicit human approval, identified recovery point, verified backup, and rollback plan.

Storage backup is a separate concern from PostgreSQL backup. The MVP lifecycle intentionally deletes invitation assets after grace period; backups must not accidentally defeat the product's deletion policy without a defined retention policy.

## Validation Safety

Database reset/rebuild testing may only run against:
- local Supabase; or
- dedicated remote Supabase development project.

Never run reset/rebuild validation against production.
