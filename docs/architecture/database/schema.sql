-- Weplan MVP core schema
-- Apply using Supabase migration tooling. Review on a fresh staging project first.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  role text not null default 'couple' check (role in ('couple','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('basic','premium','vip')),
  name text not null,
  price bigint not null check (price >= 0),
  active_months integer not null check (active_months > 0),
  max_gallery_images integer not null check (max_gallery_images >= 0),
  max_youtube_videos integer not null check (max_youtube_videos >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.tiers(id),
  name text not null,
  slug text not null unique,
  description text,
  thumbnail_path text not null,
  preview_path text,
  renderer_key text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.profiles(id),
  theme_id uuid not null references public.themes(id),
  slug text not null unique,
  groom_name text,
  groom_father_name text,
  groom_mother_name text,
  groom_photo_path text,
  bride_name text,
  bride_father_name text,
  bride_mother_name text,
  bride_photo_path text,
  cover_photo_path text,
  music_path text,
  opening_greeting text,
  prayer_text text,
  rsvp_enabled boolean not null default true,
  wishes_enabled boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft','payment_pending','active','expired')),
  published_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz,
  delete_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null,
  event_date date not null,
  start_time text not null,
  end_time text,
  until_finished boolean not null default false,
  address text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_main_event boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or (latitude >= -90 and latitude <= 90)),
  check (longitude is null or (longitude >= -180 and longitude <= 180))
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  title text not null,
  story_date date,
  description text not null,
  image_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  type text not null check (type in ('image','youtube')),
  image_path text,
  youtube_video_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (
    (type='image' and image_path is not null and youtube_video_id is null)
    or
    (type='youtube' and youtube_video_id is not null and image_path is null)
  )
);

create table public.gift_accounts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitation_guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null,
  guest_token_hash text not null unique,
  guest_token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id, id)
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_id uuid not null,
  attendance text not null check (attendance in ('attending','not_attending')),
  guest_count integer not null default 1 check (guest_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_id),
  foreign key (invitation_id, guest_id)
    references public.invitation_guests(invitation_id, id) on delete cascade,
  check (
    (attendance='attending' and guest_count >= 1)
    or
    (attendance='not_attending' and guest_count = 0)
  )
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_id uuid not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_id),
  foreign key (invitation_id, guest_id)
    references public.invitation_guests(invitation_id, id) on delete cascade
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete set null,
  couple_id uuid not null references public.profiles(id),
  midtrans_order_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','expired','cancelled')),
  payment_type text,
  theme_id_snapshot uuid,
  theme_name_snapshot text not null,
  tier_code_snapshot text not null,
  tier_name_snapshot text not null,
  price_snapshot bigint not null check (price_snapshot >= 0),
  active_months_snapshot integer not null check (active_months_snapshot > 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  section_name text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
