# Task 13 — Storage Hardening

## Goal

Finalize and harden Weplan private Storage architecture: canonical paths, signed upload/read authorization, ownership enforcement, client-side image optimization reuse, Storage policies, and idempotent cleanup utilities.

## Depends On

12

## Required Context

- `docs/architecture/reference/STORAGE.md`
- `docs/architecture/reference/SECURITY.md`
- `docs/architecture/reference/DATABASE.md`
- `docs/architecture/database/schema.sql` — read-only, only fields that persist Storage paths on:
  - `invitations`
  - `stories`
  - `gallery_items`

- existing Storage-related implementation under:
  - `lib/storage/**`
  - relevant Task 05/07/08/11/12 files as needed for consolidation audit

Do not read unrelated future-task documents.

Architecture/database files are read-only unless explicitly listed in Allowed Paths.

## Allowed Paths

- `lib/storage/**`
- `supabase/**`
- `features/**`
- `actions/**` only when required to migrate existing Storage calls to hardened shared helpers
- `docs/architecture/database/**`
- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, payment flow, invitee/public-access flow, future task, dependency, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

## Storage Architecture

Weplan uses one private bucket:

`invitation-assets`

There must be no public invitation-assets bucket or public-object workaround.

Database stores only canonical Storage paths.

Do not persist:

- public URL;
- signed read URL;
- signed upload URL;
- arbitrary client-provided path.

## Canonical Path Contract

Canonical paths must be deterministic and server-authoritative.

Approved patterns:

### Couple Identity Photos

- `{coupleId}/{invitationId}/cover/cover.webp`
- `{coupleId}/{invitationId}/couple/groom.webp`
- `{coupleId}/{invitationId}/couple/bride.webp`

### Stories

- `{coupleId}/{invitationId}/stories/{storyId}.webp`

### Gallery

- `{coupleId}/{invitationId}/gallery/{galleryItemId}.webp`

### Music

- `{coupleId}/{invitationId}/audio/background.{approvedExt}`

UUID/database identifiers must be used where appropriate.

Do not derive paths from:

- couple names;
- invitation slug;
- guest names;
- filename supplied by user;
- arbitrary client input.

## Signed Upload

Before signed upload authorization:

1. authenticate user;
2. validate invitation ID;
3. verify invitation ownership;
4. verify child record ownership where relevant;
5. validate media type/metadata;
6. derive canonical path server-side;
7. issue signed upload authorization.

Browser uploads directly to Supabase Storage.

Application server should not proxy large file bodies.

Signed-upload helper must not allow arbitrary destination paths.

## Signed Read

Storage remains private.

Signed read URLs may be generated only after authorization appropriate to the caller.

For authenticated builder/review:

- verify invitation ownership;
- sign only canonical paths tied to owned records.

Signed URLs:

- temporary;
- not persisted;
- not logged with sensitive query parameters.

Prefer batch signed-read generation for multiple assets.

## Image Optimization

Reuse one shared client-side image optimization implementation.

Contract:

- source max 10 MB;
- supported image MIME/type;
- longest side <= 1920px;
- WebP output;
- target final <= 500 KB;
- bounded compression/resizing loop;
- reject if target cannot be reached;
- do not upload original as fallback.

Task 13 must remove unnecessary duplication of image optimization logic if duplication exists, but must not change validated behavior from earlier tasks without explicit reason.

## Audio Validation

Reuse the Task 11 audio contract:

- max 9 MB;
- approved extension/MIME combinations;
- private upload;
- canonical audio path;
- no arbitrary destination path.

Task 13 should consolidate Storage authorization helpers if duplication exists, not redesign music behavior.

## Storage Policies

Verify and harden Storage policies for `storage.objects`.

Policies must ensure authenticated couple access is constrained to objects belonging to invitations they own.

Do not rely only on path prefix string matching if ownership can be verified more safely through database relationship checks.

Privileged server cleanup may use server-only privileged credentials.

Never expose privileged Storage credentials to client.

If current Storage policies require migration changes, those changes are allowed only for Storage hardening and must be covered by database/security tests.

## Cleanup Service

Create/reuse one shared cleanup service for invitation-owned Storage.

The same cleanup service should be reusable later by:

- manual invitation deletion;
- expired invitation cleanup;
- failed/orphan upload cleanup where appropriate.

Cleanup must be idempotent.

Deleting a missing object should not make cleanup permanently fail.

Cleanup API should accept trusted domain identifiers, not arbitrary object paths supplied by client.

## Invitation Asset Cleanup

Given an owned/trusted invitation ID, cleanup should be able to remove all objects under the canonical invitation prefix:

`{coupleId}/{invitationId}/`

Use privileged server context only where required.

Do not hard-delete invitation database state inside the generic Storage helper unless explicitly invoked by a higher-level lifecycle service.

Task 13 only builds/hardens Storage cleanup primitives.

## Partial Cleanup Failure

Cleanup must handle partial failure safely.

If some Storage objects fail deletion:

- return structured failure information;
- do not falsely report complete cleanup;
- allow retry;
- avoid deleting unrelated objects.

Do not silently swallow failed cleanup.

## Orphan Upload Cleanup

Where previous flows can create uploaded objects before database persistence, shared helpers should support compensating cleanup using canonical trusted paths.

Examples:

- gallery upload loses tier race;
- failed persistence after signed upload.

Do not introduce a generic client-callable arbitrary delete endpoint.

## Acceptance Criteria

- `invitation-assets` remains private.
- No public invitation asset URL is persisted.
- Arbitrary client Storage paths are rejected.
- Canonical path helpers are shared and server-authoritative.
- Signed upload requires auth + ownership + validated destination.
- Signed reads require appropriate authorization.
- Batch signed-read works for owned assets.
- Signed URLs are temporary and not persisted.
- Shared image optimization contract remains enforced.
- Audio Storage validation remains enforced.
- Storage policies prevent cross-owner object access.
- Cleanup of invitation-owned assets is idempotent.
- Missing objects do not break retry-safe cleanup.
- Partial cleanup failure is detectable and retryable.
- Cleanup cannot delete another couple's invitation assets.
- Existing Task 05/07/08/11/12 Storage behavior remains compatible.

## Required Validation

- canonical path unit tests
- arbitrary-path rejection tests
- cross-owner upload authorization tests
- cross-owner signed-read tests
- signed URL non-persistence tests
- batch signed-read tests
- image optimization regression tests
- audio validation regression tests
- private bucket verification
- Storage policy tests
- ownership negative tests
- invitation-prefix cleanup tests
- missing-object idempotency tests
- partial-failure cleanup tests
- foreign invitation cleanup rejection
- orphan compensating cleanup tests
- existing Storage-related tests from Task 05/07/08/11/12
- full `npm run test`
- `npm run typecheck`
- `npm run lint`
- targeted read-only lint/check for all Task 13 files
- `npm run build`
- database/Storage policy validation against development Supabase when policies/migrations change
- scoped `git diff --check`
- actual scope/unrelated-change review
- credential/dependency/schema-RLS review

## Completion Output

Update:

- `docs/architecture/agent/PROJECT-STATE.md`
- `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 13 implementation and completion documentation.

Then STOP. Do not begin Task 14.
