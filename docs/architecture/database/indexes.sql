create unique index if not exists one_main_event_per_invitation
on public.wedding_events(invitation_id) where is_main_event = true;

create unique index if not exists one_paid_transaction_per_invitation
on public.transactions(invitation_id)
where status = 'paid' and invitation_id is not null;

create index if not exists invitations_couple_id_idx on public.invitations(couple_id);
create index if not exists invitations_theme_id_idx on public.invitations(theme_id);
create index if not exists invitations_status_idx on public.invitations(status);
create index if not exists invitations_delete_after_idx on public.invitations(delete_after);
create index if not exists wedding_events_invitation_id_idx on public.wedding_events(invitation_id);
create index if not exists transactions_invitation_id_idx on public.transactions(invitation_id);
create index if not exists transactions_couple_id_idx on public.transactions(couple_id);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists invitation_guests_invitation_id_idx on public.invitation_guests(invitation_id);
create index if not exists rsvps_invitation_id_idx on public.rsvps(invitation_id);
create index if not exists wishes_invitation_id_idx on public.wishes(invitation_id);
create index if not exists stories_invitation_id_idx on public.stories(invitation_id);
create index if not exists gallery_items_invitation_id_idx on public.gallery_items(invitation_id);
create index if not exists gift_accounts_invitation_id_idx on public.gift_accounts(invitation_id);
