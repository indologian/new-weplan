# Task 08 — Builder Gallery

## Goal

Implement image and YouTube gallery with server-enforced tier limits, deterministic ordering, and private Storage.

## Depends On

07

## Required Context

* `docs/architecture/reference/DATABASE.md`
* `docs/architecture/reference/STORAGE.md`
* `docs/architecture/database/schema.sql` — read-only, only definitions directly related to:

  * `gallery_items`
  * `invitations`
  * `themes`
  * `tiers`
* `docs/architecture/database/indexes.sql` — read-only, only directly related indexes/constraints if required.

Do not read unrelated reference documents or unrelated database tables.

## Allowed Paths

* `features/invitation-builder/**`
* `actions/**`
* `lib/storage/**`
* `validations/**`
* `docs/architecture/agent/PROJECT-STATE.md`
* `docs/architecture/agent/HANDOFF.md`

## Do Not Touch

Any unrelated feature, future task, schema/RLS, dependency, or architecture decision.

If a required change falls outside Allowed Paths, record a BLOCKER and stop that part.

Database architecture files are read-only context and must not be modified.

## Gallery Contract

Each gallery item is one of:

### Image

* `type = image`
* `imagePath` required
* `youtubeVideoId = null`

### YouTube

* `type = youtube`
* `youtubeVideoId` required
* `imagePath = null`

Image and YouTube values must never coexist on the same item.

## Tier Limits

Server must resolve limits from the invitation's current theme and tier.

Do not accept tier, limits, or price from the client.

Resolution flow:

`invitation`
→ `theme_id`
→ `themes.tier_id`
→ `tiers`
→ `max_gallery_images`
→ `max_youtube_videos`

MVP limits expected from architecture:

* Basic: 4 images, 0 YouTube
* Premium: 6 images, 1 YouTube
* VIP: 10 images, 2 YouTube

Database values are the runtime source of truth.

Frontend may display limits for UX, but server must enforce them on every create/upload mutation.

## Image Storage

Use the existing private bucket:

`invitation-assets`

Canonical image path:

`{coupleId}/{invitationId}/gallery/{galleryItemId}.webp`

Client must not determine trusted persisted path.

Before signed upload:

1. authenticate user;
2. verify invitation ownership;
3. resolve tier limits server-side;
4. ensure another image is still allowed;
5. create/verify owned gallery item;
6. calculate canonical path server-side;
7. issue signed upload authorization.

After successful browser upload:

1. authenticate again;
2. verify ownership;
3. calculate canonical path again;
4. persist the canonical `image_path`.

Do not persist an image path before upload succeeds.

Reuse existing image optimization utility.

Do not duplicate compressor logic.

## Image Limits

Reuse existing contract:

* input <= 10 MB;
* supported image MIME/type;
* longest side <= 1920px;
* WebP output;
* target <= 500KB;
* no original upload fallback.

## YouTube

Accept a YouTube URL or supported video identifier at the UI boundary.

Normalize server-side to a canonical `youtube_video_id`.

Persist only the video ID, not raw embed HTML.

Never accept arbitrary iframe/embed HTML.

Server must validate the normalized ID before insert/update.

YouTube item count must obey the resolved tier.

## CRUD & Ownership

All create/update/delete/reorder operations must:

* authenticate user;
* verify invitation ownership;
* ensure gallery item belongs to the supplied invitation;
* reject cross-invitation item IDs;
* never accept `coupleId` from client.

## Delete Image

When deleting an image gallery item:

1. authenticate and verify ownership;
2. determine canonical Storage path server-side;
3. remove the private Storage object;
4. remove the database row using a retry-safe flow.

Do not intentionally leave orphan files.

Deleting a YouTube item does not perform Storage operations.

## Reorder

Client sends ordered gallery item IDs only.

Server must:

* load the full gallery set for the owned invitation;
* reject duplicate IDs;
* reject foreign IDs;
* reject missing IDs;
* reject stale/incomplete sets;
* normalize `sort_order` to deterministic sequential values such as `0..n-1`.

Image and YouTube items may share one combined ordering.

## Acceptance Criteria

* Couple can add multiple gallery images up to the resolved tier limit.
* Couple can add YouTube videos up to the resolved tier limit.
* Basic cannot add YouTube video.
* Server rejects image/video counts above the resolved tier.
* Image and YouTube field exclusivity is maintained.
* Gallery items can be deleted and reordered.
* Cross-invitation mutations are rejected.
* Image Storage paths are server-authoritative.
* Failed uploads do not create fake persisted image paths.
* Deleting image items performs canonical private Storage cleanup.
* YouTube input is normalized to a safe video ID.
* No raw iframe/embed HTML is stored.

## Required Validation

* focused validation/unit tests
* tier-limit tests for Basic/Premium/VIP
* limit-boundary and limit+1 tests
* server-authoritative tier resolution tests
* image/YouTube exclusivity tests
* YouTube normalization/invalid-input tests
* CRUD integration tests
* authentication/ownership negative tests
* cross-invitation gallery ID rejection
* canonical Storage path tests
* failed-upload persistence tests
* image deletion cleanup tests
* reorder tests
* duplicate/foreign/missing/stale reorder rejection
* full `npm run test`
* `npm run typecheck`
* `npm run lint`
* targeted read-only lint/check for all Task 08 implementation files
* `npm run build`
* scoped `git diff --check`
* actual scope/unrelated-change review

## Completion Output

Update:

* `docs/architecture/agent/PROJECT-STATE.md`
* `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 08 implementation plus completion documentation.

Then STOP. Do not begin Task 09.
