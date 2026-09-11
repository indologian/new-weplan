insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'invitation-assets',
  'invitation-assets',
  false,
  10485760,
  array[
    'image/webp',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/ogg',
    'audio/wav',
    'audio/x-wav',
    'audio/wave'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "task13_invitation_assets_select" on storage.objects;
drop policy if exists "task13_invitation_assets_insert" on storage.objects;
drop policy if exists "task13_invitation_assets_update" on storage.objects;
drop policy if exists "task13_invitation_assets_delete" on storage.objects;

create policy "task13_invitation_assets_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'invitation-assets'
  and array_length(storage.foldername(name), 1) >= 2
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover/cover\.webp|couple/(groom|bride)\.webp|stories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|gallery/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|audio/background\.(mp3|m4a|ogg|wav))$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.invitations
    where invitations.id::text = (storage.foldername(name))[2]
      and invitations.couple_id = (select auth.uid())
  )
);

create policy "task13_invitation_assets_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'invitation-assets'
  and array_length(storage.foldername(name), 1) >= 2
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover/cover\.webp|couple/(groom|bride)\.webp|stories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|gallery/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|audio/background\.(mp3|m4a|ogg|wav))$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.invitations
    where invitations.id::text = (storage.foldername(name))[2]
      and invitations.couple_id = (select auth.uid())
  )
);

create policy "task13_invitation_assets_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'invitation-assets'
  and array_length(storage.foldername(name), 1) >= 2
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover/cover\.webp|couple/(groom|bride)\.webp|stories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|gallery/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|audio/background\.(mp3|m4a|ogg|wav))$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.invitations
    where invitations.id::text = (storage.foldername(name))[2]
      and invitations.couple_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'invitation-assets'
  and array_length(storage.foldername(name), 1) >= 2
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover/cover\.webp|couple/(groom|bride)\.webp|stories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|gallery/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|audio/background\.(mp3|m4a|ogg|wav))$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.invitations
    where invitations.id::text = (storage.foldername(name))[2]
      and invitations.couple_id = (select auth.uid())
  )
);

create policy "task13_invitation_assets_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'invitation-assets'
  and array_length(storage.foldername(name), 1) >= 2
  and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover/cover\.webp|couple/(groom|bride)\.webp|stories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|gallery/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp|audio/background\.(mp3|m4a|ogg|wav))$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.invitations
    where invitations.id::text = (storage.foldername(name))[2]
      and invitations.couple_id = (select auth.uid())
  )
);
