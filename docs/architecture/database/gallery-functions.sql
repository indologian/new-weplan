-- Atomic gallery creation and tier enforcement.
-- Executable source: supabase/migrations/20260910010000_task08_atomic_gallery_creation.sql

-- Signature: public.get_gallery_capacity(p_invitation_id uuid)

-- get_gallery_capacity obtains auth.uid(), verifies invitation ownership, and
-- resolves the referenced theme/tier without applying catalog is_active filters.
-- It returns only media limits and current persisted counts for upload UX.

-- Execution is revoked from PUBLIC/anon and granted only to authenticated.

-- Signature: public.create_gallery_item_atomic(
--   p_invitation_id uuid, p_gallery_item_id uuid, p_media_type text,
--   p_youtube_video_id text default null
-- )

-- The function obtains auth.uid(), verifies invitation ownership, then takes a
-- transaction-scoped advisory lock derived from the first 64 bits of
-- md5('weplan:gallery:' || invitation_id). A collision can only add
-- serialization; it cannot bypass authorization or tier enforcement.
-- Under that lock it resolves the referenced theme/tier (including inactive
-- catalog rows), counts the requested media type, calculates combined ordering,
-- derives canonical image paths, and inserts one mutually-exclusive item.

-- Execution is revoked from PUBLIC/anon and granted only to authenticated.
