# Storage Reference

Bucket: `invitation-assets`, PRIVATE.

Paths:
```
{couple_id}/{invitation_id}/cover/cover.webp
{couple_id}/{invitation_id}/couple/groom.webp
{couple_id}/{invitation_id}/couple/bride.webp
{couple_id}/{invitation_id}/gallery/{uuid}.webp
{couple_id}/{invitation_id}/stories/{story_id}.webp
{couple_id}/{invitation_id}/audio/background.{ext}
```

## Images
- initial upload max 10 MB
- optimize in browser
- longest side target <= 1920 px
- convert to WebP
- target final <= 500 KB
- upload optimized final only
- server authorizes ownership/tier and determines destination path

## Audio
- one active background audio
- max 9 MB
- allowlist supported MIME/extensions
- server validation required

## Upload
Server creates signed upload URL after authorization. Browser uploads directly to Supabase Storage.

## Read
Public invitation validates token/lifecycle first, then generates signed read URLs. Suggested read TTL: 1 hour.

## Cleanup
Manual delete and cron must share the same idempotent cleanup service.
