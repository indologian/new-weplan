# Task 11 — Builder Music

## Goal

Implement one private background-audio upload/configuration flow with authenticated ownership enforcement, server-authoritative Storage path, safe replacement/removal, and user-gesture playback behavior.

## Depends On

10

## Required Context

* `docs/architecture/reference/STORAGE.md`
* `docs/architecture/reference/DATABASE.md`
* `docs/architecture/database/schema.sql` — read-only, only the `invitations.music_path` field and directly related invitation contract.

Do not read unrelated reference documents or unrelated database tables.

`docs/architecture/database/schema.sql` is read-only context and must not be modified.

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

## Music Contract

Each invitation can have at most **one active background-audio file**.

Persistence:

* `music_path` nullable text on invitation.

There is no playlist and no separate music table in MVP.

Canonical private Storage location:

`{coupleId}/{invitationId}/audio/background.{ext}`

The Storage path must be determined server-side.

Client must never provide arbitrary persisted `music_path`.

## Supported Audio

Maximum input size:

* `9 MB`

Only allow supported audio MIME/extension combinations.

Initial MVP allowlist:

* MP3: `.mp3`
* M4A: `.m4a`
* OGG: `.ogg`
* WAV: `.wav`

Validation must consider both:

* declared MIME type;
* file extension.

Do not trust extension alone.

Do not accept:

* HTML;
* executable files;
* arbitrary binary files;
* video files renamed as audio;
* remote audio URLs.

If runtime/browser compatibility requires narrowing this allowlist, do not make that decision silently. Report a BLOCKER.

## Upload Authorization

Before issuing signed upload authorization:

1. authenticate user;
2. validate `invitationId`;
3. verify invitation ownership;
4. validate audio metadata:

   * filename/extension;
   * MIME;
   * size <= 9 MB;
5. determine canonical destination server-side;
6. issue signed upload authorization for existing private bucket.

Browser uploads directly to Supabase Storage.

Do not proxy the audio body through the application server.

## Persistence

Do not persist `music_path` before Storage upload succeeds.

After successful upload:

1. authenticate again;
2. verify invitation ownership again;
3. validate trusted audio type/extension contract;
4. calculate canonical path server-side again;
5. persist canonical `music_path`.

Client does not provide trusted path.

## Replace Existing Music

Only one active file is allowed.

When replacing music:

* new upload must use the canonical audio location for its approved extension;
* avoid intentionally leaving an old object behind if extension changes.

Example:

existing:
`audio/background.mp3`

replacement:
`audio/background.ogg`

After successful replacement, stale `background.mp3` should be cleaned up safely.

Do not delete the previous valid music before the new upload has successfully completed unless the operation can recover safely.

Preferred sequence:

new upload succeeds
→ persist new canonical path
→ cleanup previous canonical object if path differs

If cleanup fails after the new file has become authoritative:

* keep the valid persisted new music;
* return/log a controlled cleanup condition;
* do not corrupt the invitation state.

Do not invent a playlist/versioning system.

## Remove Music

Couple must be able to remove existing background music.

Flow:

1. authenticate;
2. verify invitation ownership;
3. read current canonical `music_path`;
4. remove owned private Storage object;
5. set `music_path = null` using a retry-safe flow.

Missing Storage object should not permanently prevent clearing a valid owned database reference if the object is already absent.

Cross-owner invitation must not trigger Storage deletion.

## Playback Behavior

Browser autoplay restrictions must be respected.

Music must **not autoplay before explicit user interaction**.

For builder preview:

* audio starts only after explicit user gesture such as clicking `Open Invitation` or equivalent preview control;
* loading/rendering the preview must not automatically start playback;
* user can pause/resume if the existing preview architecture supports it without broadening scope.

Do not implement public invitation music behavior beyond what is needed for Task 11 builder/preview integration.

Public invitation playback itself remains part of later rendering work.

## Signed Read URL

Because Storage is private, preview must not assume a public Storage URL.

If builder preview needs to play persisted music, obtain a temporary signed read URL only after authenticated ownership validation.

Database continues storing only the Storage path, not full signed/public URL.

Signed URLs must not be persisted.

## Acceptance Criteria

* Couple can upload one background-audio file.
* Maximum accepted source file size is 9 MB.
* Unsupported MIME/extension combinations are rejected server-side.
* Upload requires authentication and invitation ownership.
* Canonical Storage destination is server-authoritative.
* Browser cannot persist arbitrary `music_path`.
* `music_path` is persisted only after successful upload.
* Existing music can be safely replaced.
* Stale previous-extension audio is cleaned up when replacement changes canonical path.
* Existing music can be removed.
* Cross-owner upload/replace/remove is rejected.
* Private Storage is used.
* Preview playback requires explicit user gesture.
* Preview does not autoplay merely because component/page renders.
* Signed read URLs are temporary and are not stored in the database.
* No playlist is implemented.

## Required Validation

* focused audio validation tests
* exact 9 MB boundary accepted
* > 9 MB rejected
* allowed MIME + extension combinations
* mismatched MIME/extension rejection
* unsupported file rejection
* unauthenticated upload rejection
* cross-owner upload rejection
* canonical path tests
* client arbitrary path cannot become persisted path
* successful-upload-before-persistence test
* failed upload does not persist `music_path`
* replace same-extension test
* replace different-extension cleanup test
* remove existing music test
* missing-object removal behavior
* cross-owner removal does not touch Storage
* private signed-read preview tests
* preview requires explicit user gesture
* preview does not autoplay on mount/render
* full `npm run test`
* `npm run typecheck`
* `npm run lint`
* targeted read-only lint/check for all Task 11 files
* `npm run build`
* scoped `git diff --check`
* actual scope/unrelated-change review
* credential/dependency/schema-RLS review

## Completion Output

Update:

* `docs/architecture/agent/PROJECT-STATE.md`
* `docs/architecture/agent/HANDOFF.md`

Stage and commit only Task 11 implementation and completion documentation.

Then STOP. Do not begin Task 12.
