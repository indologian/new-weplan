create or replace function public.get_gallery_capacity(p_invitation_id uuid)
returns table (
  max_gallery_images integer,
  max_youtube_videos integer,
  current_gallery_images bigint,
  current_youtube_videos bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception using errcode = 'P0001', message = 'gallery_unauthenticated';
  end if;

  if not exists (
    select 1
    from public.invitations invitation
    where invitation.id = p_invitation_id
      and invitation.couple_id = caller_id
  ) then
    raise exception using errcode = 'P0001', message = 'gallery_access_denied';
  end if;

  return query
  select
    tier.max_gallery_images,
    tier.max_youtube_videos,
    count(item.id) filter (where item.type = 'image'),
    count(item.id) filter (where item.type = 'youtube')
  from public.invitations invitation
  join public.themes theme on theme.id = invitation.theme_id
  join public.tiers tier on tier.id = theme.tier_id
  left join public.gallery_items item on item.invitation_id = invitation.id
  where invitation.id = p_invitation_id
    and invitation.couple_id = caller_id
  group by tier.id, tier.max_gallery_images, tier.max_youtube_videos;
end;
$$;

revoke all on function public.get_gallery_capacity(uuid)
from public, anon, authenticated;
grant execute on function public.get_gallery_capacity(uuid) to authenticated;

create or replace function public.create_gallery_item_atomic(
  p_invitation_id uuid,
  p_gallery_item_id uuid,
  p_media_type text,
  p_youtube_video_id text default null
)
returns table (
  id uuid,
  type text,
  image_path text,
  youtube_video_id text,
  sort_order integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  media_limit integer;
  current_count bigint;
  next_sort_order integer;
  canonical_image_path text;
  lock_key bigint;
begin
  if caller_id is null then
    raise exception using errcode = 'P0001', message = 'gallery_unauthenticated';
  end if;

  if p_gallery_item_id is null then
    raise exception using errcode = 'P0001', message = 'gallery_invalid_data';
  end if;

  if not exists (
    select 1
    from public.invitations invitation
    where invitation.id = p_invitation_id
      and invitation.couple_id = caller_id
  ) then
    raise exception using errcode = 'P0001', message = 'gallery_access_denied';
  end if;

  -- A namespaced 64-bit MD5 prefix gives each invitation a deterministic
  -- transaction lock. Hash collisions are possible but extremely unlikely;
  -- a collision only causes extra serialization, never an authorization bypass.
  lock_key := (
    'x' || substr(md5('weplan:gallery:' || p_invitation_id::text), 1, 16)
  )::bit(64)::bigint;
  perform pg_catalog.pg_advisory_xact_lock(lock_key);

  select
    case p_media_type
      when 'image' then tier.max_gallery_images
      when 'youtube' then tier.max_youtube_videos
      else null
    end
  into media_limit
  from public.invitations invitation
  join public.themes theme on theme.id = invitation.theme_id
  join public.tiers tier on tier.id = theme.tier_id
  where invitation.id = p_invitation_id
    and invitation.couple_id = caller_id;

  if p_media_type not in ('image', 'youtube') or media_limit is null then
    raise exception using errcode = 'P0001', message = 'gallery_invalid_media';
  end if;

  if exists (
    select 1 from public.gallery_items item where item.id = p_gallery_item_id
  ) then
    raise exception using errcode = 'P0001', message = 'gallery_invalid_data';
  end if;

  if p_media_type = 'image' and p_youtube_video_id is not null then
    raise exception using errcode = 'P0001', message = 'gallery_invalid_data';
  end if;

  if p_media_type = 'youtube' and (
    p_youtube_video_id is null
    or p_youtube_video_id !~ '^[A-Za-z0-9_-]{11}$'
  ) then
    raise exception using errcode = 'P0001', message = 'gallery_invalid_data';
  end if;

  select count(*)
  into current_count
  from public.gallery_items item
  where item.invitation_id = p_invitation_id
    and item.type = p_media_type;

  if current_count >= media_limit then
    if p_media_type = 'image' then
      raise exception using errcode = 'P0001', message = 'gallery_image_limit_reached';
    end if;
    raise exception using errcode = 'P0001', message = 'gallery_youtube_limit_reached';
  end if;

  select coalesce(max(item.sort_order), -1) + 1
  into next_sort_order
  from public.gallery_items item
  where item.invitation_id = p_invitation_id;

  canonical_image_path := case
    when p_media_type = 'image' then
      caller_id::text || '/' || p_invitation_id::text || '/gallery/' ||
      p_gallery_item_id::text || '.webp'
    else null
  end;

  return query
  insert into public.gallery_items as inserted (
    id,
    invitation_id,
    type,
    image_path,
    youtube_video_id,
    sort_order
  ) values (
    p_gallery_item_id,
    p_invitation_id,
    p_media_type,
    canonical_image_path,
    case when p_media_type = 'youtube' then p_youtube_video_id else null end,
    next_sort_order
  )
  returning
    inserted.id,
    inserted.type,
    inserted.image_path,
    inserted.youtube_video_id,
    inserted.sort_order;
end;
$$;

revoke all on function public.create_gallery_item_atomic(uuid, uuid, text, text)
from public, anon, authenticated;
grant execute on function public.create_gallery_item_atomic(uuid, uuid, text, text)
to authenticated;
