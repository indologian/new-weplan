begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

select ok(
  exists(select 1 from storage.buckets where id = 'invitation-assets'),
  'invitation-assets bucket exists'
);
select is(
  (select public from storage.buckets where id = 'invitation-assets'),
  false,
  'invitation-assets bucket is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'invitation-assets'),
  10485760::bigint,
  'bucket upper limit is 10 MiB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'invitation-assets'),
  array['image/webp','audio/mpeg','audio/mp4','audio/x-m4a','audio/ogg','audio/wav','audio/x-wav','audio/wave']::text[],
  'bucket MIME allowlist is exact'
);

insert into auth.users (id, email) values
  ('91000000-0000-4000-8000-000000000001', 'storage-a@example.test'),
  ('91000000-0000-4000-8000-000000000002', 'storage-b@example.test');
insert into public.profiles (id, full_name, role) values
  ('91000000-0000-4000-8000-000000000001', 'Storage A', 'couple'),
  ('91000000-0000-4000-8000-000000000002', 'Storage B', 'couple');
insert into public.themes (id, tier_id, name, slug, thumbnail_path, renderer_key)
select '92000000-0000-4000-8000-000000000001', id, 'Storage Theme',
  'storage-theme-test', 'themes/storage.webp', 'storage-theme'
from public.tiers where code = 'basic';
insert into public.invitations (id, couple_id, theme_id, slug) values
  ('93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001','storage-owner-a'),
  ('93000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002','92000000-0000-4000-8000-000000000001','storage-owner-b');

insert into storage.buckets (id, name, public)
values ('task13-unrelated', 'task13-unrelated', false);
insert into storage.objects (bucket_id, name) values
  ('invitation-assets','91000000-0000-4000-8000-000000000001/93000000-0000-4000-8000-000000000001/cover/cover.webp'),
  ('invitation-assets','91000000-0000-4000-8000-000000000002/93000000-0000-4000-8000-000000000002/cover/cover.webp'),
  ('task13-unrelated','untouched/object.txt');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is((select count(*) from storage.objects where bucket_id='invitation-assets'), 0::bigint, 'anon SELECT is denied');
select throws_ok(
  $$insert into storage.objects (bucket_id,name) values ('invitation-assets','91000000-0000-4000-8000-000000000001/93000000-0000-4000-8000-000000000001/cover/anon.webp')$$,
  '42501', null, 'anon INSERT is denied'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and cmd='UPDATE' and ('anon'=any(roles) or 'public'=any(roles))),
  'anon has no UPDATE policy'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and cmd='DELETE' and ('anon'=any(roles) or 'public'=any(roles))),
  'anon has no DELETE policy'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
select is((select count(*) from storage.objects where bucket_id='invitation-assets'), 1::bigint, 'owner SELECT sees only owned invitation objects');
select lives_ok(
  $$insert into storage.objects (bucket_id,name) values ('invitation-assets','91000000-0000-4000-8000-000000000001/93000000-0000-4000-8000-000000000001/couple/groom.webp')$$,
  'owner INSERT is allowed'
);
select ok(
  exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='task13_invitation_assets_update' and cmd='UPDATE' and with_check is not null),
  'owner UPDATE policy has a WITH CHECK predicate'
);
select ok(
  exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='task13_invitation_assets_delete' and cmd='DELETE' and qual is not null),
  'owner DELETE policy has a USING predicate'
);
select is(
  (select count(*) from storage.objects where name like '91000000-0000-4000-8000-000000000002/%'),
  0::bigint,
  'foreign couple objects remain invisible'
);
select throws_ok(
  $$insert into storage.objects (bucket_id,name) values ('invitation-assets','91000000-0000-4000-8000-000000000002/93000000-0000-4000-8000-000000000001/couple/groom.webp')$$,
  '42501', null, 'fake first-segment user prefix is denied'
);
select throws_ok(
  $$insert into storage.objects (bucket_id,name) values ('invitation-assets','91000000-0000-4000-8000-000000000001/93000000-0000-4000-8000-000000000002/couple/groom.webp')$$,
  '42501', null, 'owned user prefix with foreign invitation is denied'
);
select ok(
  (select with_check like '%invitations.couple_id%' and with_check like '%foldername%' from pg_policies where schemaname='storage' and tablename='objects' and policyname='task13_invitation_assets_update'),
  'UPDATE WITH CHECK requires path and invitation ownership'
);
select throws_ok(
  $$insert into storage.objects (bucket_id,name) values ('invitation-assets','malformed.webp')$$,
  '42501', null, 'malformed names are denied'
);
select throws_ok(
  $$insert into storage.objects (bucket_id,name) values ('invitation-assets','91000000-0000-4000-8000-000000000001/93000000-0000-4000-8000-000000000001/arbitrary/file.webp')$$,
  '42501', null, 'noncanonical owned subtree is denied'
);

reset role;
select is((select count(*) from storage.objects where bucket_id='task13-unrelated'), 1::bigint, 'unrelated bucket remains unaffected');
select is(
  (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'task13_invitation_assets_%' and roles=array['authenticated']::name[]),
  4::bigint,
  'exactly four Task 13 policies target authenticated'
);
select ok(
  not exists(
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname like 'task13_invitation_assets_%'
      and ('anon'=any(roles) or 'public'=any(roles))
  ),
  'Task 13 grants no anon or public Storage policy'
);

select * from finish();
rollback;
