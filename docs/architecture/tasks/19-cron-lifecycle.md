# Task 19 — Lifecycle & Deployment

## Goal
Implement expiry/grace cleanup, Cloudflare deployment config and operational logging.

## Depends On
18

## Required Context
- `docs/architecture/deployment/CLOUDFLARE-SUPABASE.md`
- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/PAYMENT.md`
- `docs/architecture/backup/BACKUP-RESTORE.md`

Do not read unrelated reference documents.

## Allowed Paths
- `app/docs/architecture/api/cron/**`
- `lib/lifecycle/**`
- `lib/storage/**`
- `wrangler.*`
- `vite.config.*`
- `package.json`
- `docs/architecture/deployment/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
Expiry/delete flow is idempotent; transactions survive; deployment compatibility check and smoke tests pass.

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

Then STOP. Do not begin Task 20.
