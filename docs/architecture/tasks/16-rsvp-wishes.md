# Task 16 — RSVP & Wishes

## Goal
Implement invitee token-authorized RSVP/wish endpoints and couple visibility.

## Depends On
15

## Required Context
- `docs/architecture/reference/API.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/DATABASE.md`

Do not read unrelated reference documents.

## Allowed Paths
- `app/docs/architecture/api/invite/**`
- `features/rsvp/**`
- `features/wishes/**`
- `lib/invitee/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch
Any unrelated feature, future task, or architecture decision. If a required change falls outside allowed paths, record a BLOCKER and stop that part.

## Acceptance Criteria
One RSVP/wish per invitee; edit-own only; disabled/expired/cross-invitation cases rejected.

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

Then STOP. Do not begin Task 17.
