# Project State

## Completed

- 01-foundation: Next.js App Router baseline, semantic design tokens, Tailwind/shadcn-style UI foundation, and safe Supabase client/server/admin boundaries.
- 02-database-security: reproducible Supabase migration and seed, schema constraints/indexes, explicit Data API grants, RLS ownership isolation, and pgTAP security tests validated on the dedicated remote development project.
- 03-auth-onboarding: email/password and Google OAuth authentication, profile provisioning, protected couple/admin routes, authenticated logout, and role-boundary validation.
- 04-theme-engine: public theme catalog and allowlisted renderer registry, complete Elegant Green reference theme, main-event countdown, and reduced-motion policy.
- 05-builder-identity: identity draft flow, server-side theme and slug validation, authenticated persistence, and authorized private photo upload.
- 06-builder-events: authenticated multi-event CRUD, deterministic ordering, per-event location/time data, and single-main-event selection protected by the database partial unique index.
- 07-builder-story: authenticated Couple Story CRUD, deterministic complete-set ordering, optional dates, and server-authorized private story images with canonical storage paths.
- 08-builder-gallery: authenticated image and YouTube gallery CRUD, database-enforced tier limits, atomic concurrent creation, deterministic combined ordering, and server-authoritative private image storage paths.
- 09-builder-gifts: authenticated bank gift-account CRUD, exact text account-number handling, deterministic complete-set ordering, and copy-friendly presentation.
- 10-builder-interactions: authenticated invitation interaction-config read/update, independent RSVP and Wishes boolean persistence, and persisted builder state loading.
- 11-builder-music: authenticated private background-audio upload, server-authoritative canonical persistence, safe replace/remove lifecycle, and user-gesture signed preview playback.
- 12-builder-review: authenticated owner-only review and private theme preview from persisted data, server-resolved commercial summary, signed private assets, builder resume, and safe checkout boundary.
- 13-storage: private invitation-assets bucket, invitation-relation Storage policies, centralized canonical authorization and signed operations, verified optimized-image metadata, hardened shared browser compression, and retry-safe structured cleanup primitives.
- 14-couple-dashboard: authenticated owner-scoped overview and invitation management, secure guest token CRUD/link recovery, deterministic RSVP summaries, owned Wishes deletion, and reuse of Gifts, interaction settings, builder resume, and private preview boundaries.

## Current

Task 14 is complete. Task 15 has not been started.

## Pending

14 through 20-production-hardening.

## Architecture invariants

- Next.js App Router, no `src/`
- Cloudflare Workers deployment; prefer vinext for new deployment, subject to compatibility check
- [x] **01**: Supabase SSR Auth
- [x] **02**: User Roles & Authorization
- [x] **03**: Route Middleware
- [x] **04**: Theme Engine
- [x] **05**: Builder Identity
- [x] **06**: Builder Event & Content
- [x] **07**: Builder Story
- [x] **08**: Builder Gallery
- [x] **09**: Builder Gifts
- [x] **10**: Builder Interaction Config
- [x] **11**: Builder Music
- [x] **12**: Builder Review & Preview
- [x] **13**: Storage Hardening
- [x] **14**: Couple Dashboard
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

- The connected Supabase MCP identity cannot inspect the dedicated development project; Task 03 OAuth state was therefore verified through the authenticated application flow and its RLS-backed profile query.
- The standard lint script does not include every Task 04/05 source directory; the full Task 04/05 implementation scope is additionally covered by a read-only targeted Biome check.
- The standard lint script does not include every Task 08 source directory; all Task 08 application files are additionally covered by a read-only targeted Biome check.
- The standard lint script does not include every Task 09 source directory; all Task 09 implementation files are additionally covered by a read-only targeted Biome check.
- The standard lint script does not include every Task 10 source directory; all Task 10 implementation files are additionally covered by a read-only targeted Biome check.
- The standard lint script does not include every Task 11 source directory; all Task 11 implementation files are additionally covered by a read-only targeted Biome check.
- The standard lint script does not include every Task 12 source directory; all Task 12 implementation files are additionally covered by a read-only targeted Biome check.
- The standard lint script does not include every Task 13 source directory; all Task 13 application files are additionally covered by a read-only targeted Biome check.
- The Supabase Security Advisor connector was unavailable to the connected identity during Task 13; bucket, policy, grant, RLS, migration, and effective Storage API behavior were instead verified directly against the dedicated development project.

## Environment Constraints

- Local Docker/Supabase is unavailable.
- Database validation may use a dedicated remote Supabase development project.
- Production must never be used for destructive database validation.
