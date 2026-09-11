# Task 10 — Builder Interaction Config

## Goal

Implement builder configuration toggles for RSVP and Wishes.

## Depends On

09

## Required Context

- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only the `invitations` fields directly related to:
  - `rsvp_enabled`
  - `wishes_enabled`

Do not read unrelated reference documents or unrelated database tables.

## Allowed Paths

- `features/invitation-builder/**`
- `actions/**`
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, future task, schema/RLS, dependency, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

`docs/architecture/database/schema.sql` is read-only context and must not be modified.

## Interaction Config Contract

Invitation configuration contains:

- `rsvpEnabled: boolean`
- `wishesEnabled: boolean`

Persistence maps to:

- `rsvp_enabled`
- `wishes_enabled`

Both values must remain boolean end-to-end.

Do not convert them to string, integer, or nullable values.

## Builder Behavior

Couple can independently enable or disable:

- RSVP
- Wishes

The two toggles are independent.

Valid combinations:

- RSVP on / Wishes on
- RSVP on / Wishes off
- RSVP off / Wishes on
- RSVP off / Wishes off

Do not introduce coupling between the two toggles.

## Persistence

All writes must:

1. authenticate user;
2. verify invitation ownership;
3. validate input server-side;
4. update only the two approved configuration fields.

Do not allow this action to become a generic invitation update action.

Do not accept:

- `coupleId`
- owner ID
- invitation status changes
- theme/tier changes
- unrelated invitation fields

from client input.

## Future Public Contract

Task 10 does not implement public RSVP/Wishes submission.

However, persisted configuration must be reliable for future public endpoints to enforce:

- if `rsvp_enabled = false`, public RSVP mutation must later be rejectable;
- if `wishes_enabled = false`, public Wishes mutation must later be rejectable.

Do not implement those future endpoints in Task 10.

## Acceptance Criteria

- Couple can toggle RSVP independently.
- Couple can toggle Wishes independently.
- All four boolean combinations persist correctly.
- Config remains persisted across page reload.
- Only authenticated owner can change config.
- Cross-owner invitation mutation is rejected.
- Server action updates only `rsvp_enabled` and `wishes_enabled`.
- Persisted values are suitable as authoritative flags for later public RSVP/Wishes endpoints.

## Required Validation

- focused validation/unit tests
- authenticated owner update test
- unauthenticated rejection
- cross-owner invitation rejection
- all four boolean-combination tests
- persistence mapping tests
- test that unrelated invitation fields cannot be mutated through this contract
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 10 files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 10 implementation and completion documentation.

Then STOP. Do not begin Task 11.
