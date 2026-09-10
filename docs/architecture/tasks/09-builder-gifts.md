# Task 09 — Builder Gifts

## Goal

Implement multiple bank gift accounts with authenticated ownership enforcement, deterministic ordering, and copy-friendly account-number presentation.

## Depends On

08

## Required Context

- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only the `gift_accounts` table definition and directly related constraints/indexes.

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

## Gift Account Contract

Each bank gift account contains:

- `bankName`
- `accountNumber`
- `accountHolder`
- `sortOrder`

`accountNumber` must remain a **string/text value** throughout:

- form state;
- validation;
- Server Action contract;
- database persistence;
- presentation.

Never convert account numbers to numeric types.

Leading zeroes must be preserved.

## Acceptance Criteria

- Couple can create multiple bank accounts.
- Couple can edit an owned bank account.
- Couple can delete an owned bank account.
- Couple can reorder bank accounts.
- Account number remains text and preserves leading zeroes.
- Copy action uses the exact persisted account number.
- All mutations require authenticated invitation ownership.
- Gift account IDs from another invitation cannot be updated, deleted, or reordered.
- Ordering is deterministic and server-authoritative.

## CRUD & Ownership

Every mutation must:

1. authenticate user;
2. verify invitation ownership;
3. for existing rows verify `gift_account.id + invitation_id`;
4. reject cross-invitation IDs;
5. never accept `coupleId` from client.

Do not rely only on frontend filtering.

RLS remains defense-in-depth.

## Validation

Server-side validation is authoritative.

At minimum:

- `bankName` required;
- `accountNumber` required and treated as string;
- `accountHolder` required.

Trim surrounding whitespace where appropriate, but do not normalize account-number contents in a way that removes meaningful leading zeroes.

Do not perform arithmetic on account numbers.

## Reorder

Client sends ordered gift-account IDs only.

Server must:

- load the complete current gift-account set for the owned invitation;
- reject duplicate IDs;
- reject foreign IDs;
- reject missing IDs;
- reject stale/incomplete sets;
- normalize `sort_order` to deterministic sequential values such as `0..n-1`.

Do not silently reorder a subset.

## Presentation

Builder UI should support copy-friendly account-number display.

Copy action should copy the exact account-number string represented by the saved data.

Do not add payment-transfer integrations, bank verification APIs, e-wallets, QRIS, or external banking APIs in Task 09.

## Acceptance Tests

At minimum:

- valid gift-account creation;
- multiple accounts under one invitation;
- account number with leading zeroes persists unchanged;
- edit owned account;
- delete owned account;
- unauthenticated mutation rejected;
- cross-owner invitation rejected;
- account ID from another invitation rejected;
- valid reorder;
- duplicate reorder IDs rejected;
- foreign reorder IDs rejected;
- missing/stale reorder set rejected;
- copy presentation uses exact string value.

## Required Validation

- focused validation/unit tests
- CRUD integration-style tests
- authentication and ownership negative tests
- cross-invitation gift-account ID tests
- deterministic reorder tests
- account-number text/leading-zero tests
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 09 implementation files
- `npm run build`
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 09 implementation and completion documentation.

Then STOP. Do not begin Task 10.
