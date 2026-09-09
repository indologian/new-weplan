# Project State

## Completed

- 01-foundation: Next.js App Router baseline, semantic design tokens, Tailwind/shadcn-style UI foundation, and safe Supabase client/server/admin boundaries.
- 02-database-security: reproducible Supabase migration and seed, schema constraints/indexes, explicit Data API grants, RLS ownership isolation, and pgTAP security tests validated on the dedicated remote development project.
- 03-auth-onboarding: email/password and Google OAuth authentication, profile provisioning, protected couple/admin routes, authenticated logout, and role-boundary validation.
- 04-theme-engine: public theme catalog and allowlisted renderer registry, complete Elegant Green reference theme, main-event countdown, and reduced-motion policy.
- 05-builder-identity: identity draft flow, server-side theme and slug validation, authenticated persistence, and authorized private photo upload.
- 06-builder-events: authenticated multi-event CRUD, deterministic ordering, per-event location/time data, and single-main-event selection protected by the database partial unique index.

## Current

Task 06 is complete. Task 07 has not been started.

## Pending

07-publish-payment through 20-production-hardening.

## Architecture invariants

- Next.js App Router, no `src/`
- Cloudflare Workers deployment; prefer vinext for new deployment, subject to compatibility check
- [x] **01**: Supabase SSR Auth
- [x] **02**: User Roles & Authorization
- [x] **03**: Route Middleware
- [x] **04**: Theme Engine
- [x] **05**: Builder Identity
- [x] **06**: Builder Event & Content
- [ ] **07**: Publish & Payment
- Supabase with RLS
- private invitation asset bucket
- invitee token hash for lookup + encrypted token for dashboard recovery
- shadcn/ui for application UI, not mandatory inside invitation themes
- Motion for React for invitation animation
- theme/tier separated
- payment webhook verified and idempotent
- invitation hard delete after expiry + 7-day grace; transaction history retained

## Known blockers

None.

## Known issues

- The provided workspace is not a Git repository, so unrelated-change verification cannot use `git diff`/`git status`.
- Supabase Security Advisor reports one warning for authenticated execution of the architecture-defined `SECURITY DEFINER public.is_admin()` RLS helper. Anonymous execution is explicitly revoked and covered by a negative test.
- The connected Supabase MCP identity cannot inspect the dedicated development project; Task 03 OAuth state was therefore verified through the authenticated application flow and its RLS-backed profile query.
- The standard lint script does not include every Task 04/05 source directory; the full Task 04/05 implementation scope is additionally covered by a read-only targeted Biome check.

## Environment Constraints

- Local Docker/Supabase is unavailable.
- Database validation may use a dedicated remote Supabase development project.
- Production must never be used for destructive database validation.
