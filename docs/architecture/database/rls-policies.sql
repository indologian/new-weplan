-- Baseline RLS. Review and test in staging before production.
alter table public.profiles enable row level security;
alter table public.tiers enable row level security;
alter table public.themes enable row level security;
alter table public.invitations enable row level security;
alter table public.wedding_events enable row level security;
alter table public.stories enable row level security;
alter table public.gallery_items enable row level security;
alter table public.gift_accounts enable row level security;
alter table public.invitation_guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
alter table public.transactions enable row level security;
alter table public.homepage_sections enable row level security;

-- Explicit Data API privileges. New Supabase projects do not expose tables
-- automatically; RLS remains the row-level authorization boundary.
revoke all on all tables in schema public from anon, authenticated;

grant select on public.tiers, public.themes, public.homepage_sections
to anon, authenticated;

grant insert, update, delete on public.tiers, public.themes, public.homepage_sections
to authenticated;

grant select, insert, update, delete on
  public.invitations,
  public.wedding_events,
  public.stories,
  public.gallery_items,
  public.gift_accounts,
  public.invitation_guests
to authenticated;

grant select on public.profiles, public.rsvps, public.wishes, public.transactions
to authenticated;

grant update on public.profiles to authenticated;
grant delete on public.wishes to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "profile self or admin read"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profile self update"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "public catalog read tiers"
on public.tiers for select to anon, authenticated using (is_active = true);

create policy "public catalog read themes"
on public.themes for select to anon, authenticated using (is_active = true);

create policy "public homepage visibility read"
on public.homepage_sections for select to anon, authenticated using (true);

create policy "admin tiers all"
on public.tiers for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin themes all"
on public.themes for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin homepage all"
on public.homepage_sections for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "couple own invitation read"
on public.invitations for select to authenticated
using (couple_id = auth.uid() or public.is_admin());

create policy "couple own invitation insert"
on public.invitations for insert to authenticated
with check (couple_id = auth.uid() or public.is_admin());

create policy "couple own invitation update"
on public.invitations for update to authenticated
using (couple_id = auth.uid() or public.is_admin())
with check (couple_id = auth.uid() or public.is_admin());

create policy "couple own invitation delete"
on public.invitations for delete to authenticated
using (couple_id = auth.uid() or public.is_admin());

-- Child ownership helper pattern. Repeat explicitly for each owned child table.
create policy "events owned invitation"
on public.wedding_events for all to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())))
with check (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "stories owned invitation"
on public.stories for all to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())))
with check (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "gallery owned invitation"
on public.gallery_items for all to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())))
with check (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "gifts owned invitation"
on public.gift_accounts for all to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())))
with check (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "guests owned invitation"
on public.invitation_guests for all to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())))
with check (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "rsvps owner read"
on public.rsvps for select to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "wishes owner read delete"
on public.wishes for select to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "wishes owner delete"
on public.wishes for delete to authenticated
using (exists(select 1 from public.invitations i where i.id=invitation_id and (i.couple_id=auth.uid() or public.is_admin())));

create policy "transactions owner read"
on public.transactions for select to authenticated
using (couple_id=auth.uid() or public.is_admin());

-- RSVP/Wish public writes intentionally have NO anon policy.
-- Token-authorized route handlers use server-only privileged client after validation.
-- Transaction writes also occur through trusted server code.
