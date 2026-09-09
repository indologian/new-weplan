begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'couple-a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'couple-b@example.test'),
  ('00000000-0000-0000-0000-000000000003', 'admin@example.test');

insert into public.profiles (id, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Couple A', 'couple'),
  ('00000000-0000-0000-0000-000000000002', 'Couple B', 'couple'),
  ('00000000-0000-0000-0000-000000000003', 'Admin', 'admin');

insert into public.themes (id, tier_id, name, slug, thumbnail_path, renderer_key)
select
  '10000000-0000-0000-0000-000000000001',
  id,
  'Test Theme',
  'test-theme',
  'themes/test.webp',
  'test-renderer'
from public.tiers
where code = 'basic';

insert into public.invitations (id, couple_id, theme_id, slug)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'couple-a-invitation'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'couple-b-invitation'
  );

insert into public.stories (invitation_id, title, description)
values
  ('20000000-0000-0000-0000-000000000001', 'A story', 'Owned by A'),
  ('20000000-0000-0000-0000-000000000002', 'B story', 'Owned by B');

insert into public.invitation_guests (id, invitation_id, name, guest_token_hash, guest_token_encrypted)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Guest A',
    'hash-a',
    'encrypted-a'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Guest B',
    'hash-b',
    'encrypted-b'
  );

insert into public.transactions (
  invitation_id,
  couple_id,
  midtrans_order_id,
  theme_name_snapshot,
  tier_code_snapshot,
  tier_name_snapshot,
  price_snapshot,
  active_months_snapshot
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'order-a',
    'Test Theme',
    'basic',
    'Basic',
    0,
    3
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'order-b',
    'Test Theme',
    'basic',
    'Basic',
    0,
    3
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*) from public.invitations),
  1::bigint,
  'a couple can read only their invitation'
);

select is(
  (select count(*) from public.stories),
  1::bigint,
  'child rows are isolated through invitation ownership'
);

select is(
  (select count(*) from public.transactions),
  1::bigint,
  'transactions are isolated by couple ownership'
);

select is_empty(
  $$
    update public.invitations
    set groom_name = 'Forbidden'
    where id = '20000000-0000-0000-0000-000000000002'
    returning 1
  $$,
  'a couple cannot update another couple invitation'
);

select throws_ok(
  $$
    insert into public.invitations (couple_id, theme_id, slug)
    values (
      '00000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      'forged-owner'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "invitations"',
  'a couple cannot create an invitation for another owner'
);

select is_empty(
  $$update public.tiers set name = 'Compromised' where code = 'basic' returning 1$$,
  'a couple cannot cross the admin catalog boundary'
);

select is(public.is_admin(), false, 'a couple is not treated as an admin');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);

select is((select count(*) from public.invitations), 2::bigint, 'an admin can read all invitations');
select is(public.is_admin(), true, 'the server-side admin predicate recognizes an admin');

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$select public.is_admin()$$,
  '42501',
  'permission denied for function is_admin',
  'anonymous users cannot execute the privileged admin predicate'
);

select is((select count(*) from public.tiers), 3::bigint, 'anonymous users can read the active tier catalog');

select throws_ok(
  $$select count(*) from public.invitations$$,
  '42501',
  'permission denied for table invitations',
  'anonymous users cannot read invitations directly'
);

select throws_ok(
  $$
    insert into public.rsvps (invitation_id, guest_id, attendance, guest_count)
    values (
      '20000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      'attending',
      1
    )
  $$,
  '42501',
  'permission denied for table rsvps',
  'anonymous invitees cannot write RSVP rows directly'
);

select throws_ok(
  $$
    insert into public.wishes (invitation_id, guest_id, message)
    values (
      '20000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      'Unsafe direct write'
    )
  $$,
  '42501',
  'permission denied for table wishes',
  'anonymous invitees cannot write wish rows directly'
);

reset role;

select throws_ok(
  $$
    insert into public.rsvps (invitation_id, guest_id, attendance, guest_count)
    values (
      '20000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000002',
      'attending',
      1
    )
  $$,
  '23503',
  null,
  'the composite guest foreign key rejects cross-invitation corruption'
);

insert into public.wedding_events (
  invitation_id,
  name,
  event_date,
  start_time,
  address,
  is_main_event
)
values (
  '20000000-0000-0000-0000-000000000001',
  'Main event',
  '2027-01-01',
  '09:00',
  'Test address',
  true
);

select throws_ok(
  $$
    insert into public.wedding_events (
      invitation_id,
      name,
      event_date,
      start_time,
      address,
      is_main_event
    )
    values (
      '20000000-0000-0000-0000-000000000001',
      'Second main event',
      '2027-01-02',
      '09:00',
      'Test address',
      true
    )
  $$,
  '23505',
  null,
  'an invitation cannot have two main wedding events'
);

update public.transactions set status = 'paid' where midtrans_order_id = 'order-a';

select throws_ok(
  $$
    insert into public.transactions (
      invitation_id,
      couple_id,
      midtrans_order_id,
      status,
      theme_name_snapshot,
      tier_code_snapshot,
      tier_name_snapshot,
      price_snapshot,
      active_months_snapshot
    )
    values (
      '20000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      'duplicate-paid-order',
      'paid',
      'Test Theme',
      'basic',
      'Basic',
      0,
      3
    )
  $$,
  '23505',
  null,
  'an invitation cannot have two paid transactions'
);

select * from finish();
rollback;
