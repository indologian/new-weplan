# Task 18 — Admin

## Goal

Implement authenticated Admin Dashboard for revenue insights, transaction visibility, active invitation visibility, theme management, tier pricing/entitlements, and homepage section visibility.

## Depends On

17

## Required Context

- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/database/schema.sql` — read-only, only definitions directly related to:
  - `profiles`
  - `tiers`
  - `themes`
  - `invitations`
  - `transactions`
  - `homepage_sections`

- `docs/architecture/database/indexes.sql` — read-only, only relevant admin/query indexes and constraints

Do not read unrelated reference documents or unrelated database tables.

Architecture/database files are read-only and must not be modified.

## Allowed Paths

- `app/dashboard/admin/**`
- `features/admin/**`
- `actions/admin/**`
- `validations/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`
- `supabase/migrations/**`
- `supabase/tests/database/**`
- `docs/architecture/database/**` only for approved Task 18 admin-overview function documentation

## Do Not Touch

Any unrelated feature, payment state machine, public invitee flow, couple dashboard implementation, Storage architecture, cron/lifecycle Task 19, schema/RLS, dependency, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

## Admin Overview Aggregation

Exact Admin Overview metrics must be calculated in the database rather than by loading unbounded transaction history into the application.

Task 18 may add one narrowly scoped read-only PostgreSQL function/RPC for Admin Overview.

Logical contract:

`get_admin_overview_metrics()`

The function returns only the approved overview metrics:

- total paid revenue;
- total paid transaction count;
- total pending transaction count;
- total failed/expired/cancelled transaction count;
- total active invitation count.

### Revenue Authority

Revenue must use:

`transactions.price_snapshot`

only where:

`transactions.status = 'paid'`

Do not use:

- current tier price;
- current theme/tier configuration;
- invitation current status.

Historical transaction snapshots remain immutable.

### Authorization

The function must verify that the current authenticated caller is an admin.

Preferred security contract:

- no parameters selecting user/admin identity;
- derive caller from `auth.uid()`;
- verify corresponding `profiles.role = 'admin'`;
- fail closed for unauthenticated or non-admin caller.

If `SECURITY DEFINER` is required:

- `SET search_path = ''`;
- fully qualify all relations/functions;
- revoke `PUBLIC`;
- revoke `anon`;
- grant EXECUTE only to `authenticated`;
- retain explicit admin-role verification inside the function.

Do not rely solely on frontend or route authorization.

### Data Boundary

Return only aggregate metrics.

Do not return:

- transaction rows;
- couple IDs;
- invitation IDs;
- commercial snapshot details;
- payment metadata;
- admin/profile records.

### Mutation Boundary

This RPC is strictly read-only.

It must not:

- insert;
- update;
- delete;
- mutate payment state;
- mutate invitation lifecycle;
- mutate tier/theme data.

### Numeric Safety

Revenue must remain integer-safe.

Do not cast monetary values through floating point.

The application may serialize the aggregated bigint in a safe representation suitable for JavaScript/UI.

### Required Database Tests

At minimum:

- unauthenticated execution rejected;
- authenticated couple rejected;
- admin execution succeeds;
- paid transaction included;
- pending excluded from revenue;
- failed excluded;
- expired excluded;
- cancelled excluded;
- revenue uses `price_snapshot`;
- current tier price change does not affect historical revenue;
- active invitation count includes only `status = 'active'`;
- function cannot mutate database state;
- `PUBLIC` cannot execute;
- `anon` cannot execute;
- only intended authenticated role has EXECUTE permission.

No RLS change is required.

## Admin Authorization

All Admin Dashboard pages and mutations require:

authenticated user
→ `profiles.role = 'admin'`

Do not rely on UI hiding.

Every admin mutation must verify admin role server-side.

A `couple` must not be able to call admin actions directly even if they know the route or action payload.

Reuse existing `requireAdmin`/admin authorization helper if available.

Do not create a second incompatible admin-role implementation.

## Dashboard Sections

Admin Dashboard contains:

- Overview
- Transactions
- Active Invitations
- Themes
- Tiers
- Homepage Sections

## Overview / Revenue

Revenue insight must be calculated from persisted transaction history.

Revenue source of truth:

`transactions`

Count revenue only from transactions whose internal status is:

`paid`

Use:

`price_snapshot`

Do NOT calculate historical revenue from:

- current tier price;
- current theme;
- invitation current status.

Historical transaction snapshots are immutable financial records.

Suggested overview metrics:

- total paid revenue
- total paid transactions
- pending transactions
- failed/expired/cancelled transactions
- active invitations

Do not implement advanced BI/analytics infrastructure.

## Transactions

Admin may view transaction history.

Display safe fields such as:

- order ID
- couple reference/presentation
- invitation relationship if still present
- theme snapshot
- tier snapshot
- price snapshot
- internal payment status
- payment type
- paid_at
- created_at

Historical transaction snapshot fields are read-only.

Admin must NOT edit:

- `price_snapshot`
- `theme_name_snapshot`
- `tier_*_snapshot`
- `active_months_snapshot`
- `paid_at`
- transaction status

through Task 18.

Transaction status remains payment-system authority from Task 17.

No manual "mark paid" button.

## Active Invitations

Admin may view currently active invitations.

Source:

`invitations.status = 'active'`

Display only operational/presentation data needed to inspect active invitations, for example:

- invitation slug
- couple name
- selected theme
- paid_at
- expires_at
- private/admin navigation link

Task 18 must not modify invitation lifecycle.

Admin must not manually:

- activate;
- expire;
- extend;
- delete;
- alter paid_at/expires_at/delete_after.

Lifecycle automation remains Task 19.

## Theme Management

Admin may:

- create theme metadata
- edit theme metadata
- assign theme to tier
- enable/disable theme

Theme fields follow actual database contract.

At minimum existing architecture includes:

- name
- slug
- tier relationship
- description
- thumbnail path
- preview path
- renderer_key
- is_active

Theme source-code renderer must already exist in allowlisted registry.

Admin cannot create arbitrary executable renderer code from Dashboard.

`renderer_key` must resolve to an existing allowlisted renderer.

Do not create a CMS/theme-builder.

## Theme Deactivation

Prefer:

`is_active = false`

rather than hard delete for themes used by existing/historical invitations.

Task 18 should not hard-delete a theme referenced by invitations or transaction history.

Inactive theme:

- unavailable for new selection according to existing architecture;
- remains resolvable for existing invitation/payment history.

Do not change Task 17 inactive-theme checkout rule.

## Theme Slug / Renderer Validation

Theme slug must follow existing theme/public-demo conventions.

`renderer_key` must be server-validated against the existing source-code registry.

Do not trust renderer key solely because it came from admin UI.

Unknown renderer key must be rejected.

## Tier Management

Admin may manage tier commercial/configuration values.

Existing tiers:

- Basic
- Premium
- VIP

Fields include:

- name/code
- price
- active months
- max gallery images
- max YouTube videos
- is_active

Use actual schema contract.

## Tier Pricing

Admin may update tier price.

Price must:

- remain integer IDR representation;
- be nonnegative according to DB contract;
- be server-validated.

Changing tier price affects future checkout reservations only.

It must NOT mutate:

- historical transactions;
- transaction snapshots;
- already-paid invitation duration;
- existing transaction price snapshots.

Task 17 snapshots remain immutable.

## Tier Entitlement Changes

If admin may update:

- active months
- gallery limits
- YouTube limits

these changes affect future/current entitlement resolution according to existing architecture.

Do not retroactively rewrite transaction snapshots.

If architecture does not explicitly permit changing a specific tier field, report BLOCKER rather than invent admin functionality.

## Tier Deactivation

`tiers.is_active = false` affects catalog/new selection behavior.

Do not delete referenced tier records.

Do not change existing Task 08/17 behavior for invitations already referencing inactive tiers.

## Homepage Section Visibility

Admin may toggle only:

`is_visible`

for configured homepage sections.

Homepage is NOT a CMS in MVP.

Task 18 must not implement editing of:

- section HTML
- text copy
- images
- component code
- layout
- arbitrary section keys

Allowed behavior:

- list configured sections
- toggle visible/hidden

Navbar remains outside toggle control according to architecture.

Do not allow admin to create arbitrary component/section definitions unless the existing DB contract explicitly requires it.

## Homepage Sort Order

If `sort_order` is already an architecture-supported admin field, it may be displayed or edited only if Task 18 source contract explicitly requires it.

Otherwise do not add drag/reorder functionality.

Visibility toggle is the Must Have.

## Admin Mutations

Every mutation must:

1. authenticate;
2. verify admin role;
3. validate input server-side;
4. mutate only explicitly approved fields;
5. return controlled result.

Do not accept role from browser.

Do not accept generic table/column/value mutation contracts.

Avoid generic admin action such as:

`updateTable(table, data)`

Use domain-specific actions.

## Audit / Logging

Task 18 does not require full audit-log infrastructure.

However, admin mutation errors must not expose:

- service-role credentials
- SQL internals
- constraint names unnecessarily
- secret payment metadata

Do not log privileged credentials.

## Acceptance Criteria

- Admin Dashboard requires authenticated admin role.
- Couple cannot access admin pages.
- Couple cannot call admin mutations directly.
- Revenue uses paid `transactions.price_snapshot`.
- Historical transaction snapshots are read-only.
- Transaction status cannot be manually changed by admin.
- Active invitation list is read-only with respect to lifecycle.
- Theme CRUD/disable works within approved metadata contract.
- Unknown `renderer_key` is rejected.
- Themes referenced historically are disabled rather than destructively deleted.
- Tier price updates affect future checkout only.
- Historical transaction snapshots remain unchanged after tier price edit.
- Tier entitlement changes do not rewrite payment snapshots.
- Homepage section visibility toggle works.
- Homepage remains toggle-only, not CMS.
- Navbar visibility is not admin-toggleable.
- Task 18 does not implement cron/expiry cleanup.

## Required Validation

### Authorization

- unauthenticated admin route rejection
- couple-role admin route rejection
- admin access success
- couple direct mutation rejection
- forged role input has no authority

### Revenue / Transactions

- only paid transactions count toward revenue
- pending/failed/expired/cancelled excluded from revenue
- revenue uses `price_snapshot`
- tier price changes do not alter historical revenue
- transaction snapshots cannot be mutated via admin actions
- transaction status has no admin mutation path

### Active Invitations

- only active invitations listed
- no manual activation
- no manual expiry
- no lifecycle timestamp mutation

### Themes

- create valid theme metadata
- edit allowed fields
- disable theme
- unknown renderer key rejection
- renderer allowlist validation
- referenced theme is not hard-deleted
- tier assignment validation

### Tiers

- valid price update
- invalid/negative price rejected
- future checkout resolves updated price
- historical transaction snapshot unchanged
- entitlement field validation
- inactive tier behavior remains compatible with existing architecture

### Homepage

- configured sections listed
- visibility toggle persists
- navbar cannot be toggled
- arbitrary section content cannot be edited
- no CMS-style mutation contract exists

### Regression / Scope

- Task 17 payment snapshots/state unchanged
- Task 14 couple dashboard unaffected
- no transaction activation mutation
- no invitation lifecycle mutation
- no Task 19 cron/cleanup
- no schema/RLS changes

### Final Validation

- focused Task 18 tests
- admin authorization/security negative tests
- relevant Task 17 payment regressions
- relevant Task 14 dashboard regressions
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 18 files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review
- staged-file review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 18 implementation and completion documentation.

Then STOP. Do not begin Task 19.
