begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

insert into auth.users (id, email) values
  ('80000000-0000-0000-0000-000000000001', 'gallery-a@example.test'),
  ('80000000-0000-0000-0000-000000000002', 'gallery-b@example.test');
insert into public.profiles (id, full_name, role) values
  ('80000000-0000-0000-0000-000000000001', 'Gallery A', 'couple'),
  ('80000000-0000-0000-0000-000000000002', 'Gallery B', 'couple');

insert into public.themes (id, tier_id, name, slug, thumbnail_path, renderer_key)
select '81000000-0000-0000-0000-000000000001'::uuid, id, 'Gallery Basic',
  'gallery-basic-test', 'themes/basic.webp', 'gallery-basic' from public.tiers where code='basic'
union all
select '81000000-0000-0000-0000-000000000002'::uuid, id, 'Gallery Premium',
  'gallery-premium-test', 'themes/premium.webp', 'gallery-premium' from public.tiers where code='premium'
union all
select '81000000-0000-0000-0000-000000000003'::uuid, id, 'Gallery VIP',
  'gallery-vip-test', 'themes/vip.webp', 'gallery-vip' from public.tiers where code='vip';

insert into public.invitations (id, couple_id, theme_id, slug) values
  ('82000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','gallery-basic-owner'),
  ('82000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000002','gallery-premium-owner'),
  ('82000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000003','gallery-vip-owner'),
  ('82000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000001','gallery-foreign-owner');

select ok(not has_function_privilege('anon', 'public.get_gallery_capacity(uuid)', 'EXECUTE'), 'anon cannot execute capacity RPC');
select ok(not has_function_privilege('anon', 'public.create_gallery_item_atomic(uuid,uuid,text,text)', 'EXECUTE'), 'anon cannot execute creation RPC');
select ok(has_function_privilege('authenticated', 'public.get_gallery_capacity(uuid)', 'EXECUTE'), 'authenticated can execute capacity RPC');
select ok(has_function_privilege('authenticated', 'public.create_gallery_item_atomic(uuid,uuid,text,text)', 'EXECUTE'), 'authenticated can execute creation RPC');
select ok(
  pg_catalog.pg_get_function_arguments('public.create_gallery_item_atomic(uuid,uuid,text,text)'::regprocedure)
    = 'p_invitation_id uuid, p_gallery_item_id uuid, p_media_type text, p_youtube_video_id text DEFAULT NULL::text',
  'atomic RPC accepts no client tier, limit, owner, path, or sort fields'
);
select ok(
  pg_catalog.pg_get_functiondef('public.create_gallery_item_atomic(uuid,uuid,text,text)'::regprocedure)
    like '%pg_advisory_xact_lock%',
  'atomic RPC serializes concurrent creation per invitation'
);
select is(
  pg_catalog.pg_get_function_result('public.get_gallery_capacity(uuid)'::regprocedure),
  'TABLE(max_gallery_images integer, max_youtube_videos integer, current_gallery_images bigint, current_youtube_videos bigint)',
  'capacity RPC exposes only the approved fields'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select * from public.get_gallery_capacity('82000000-0000-0000-0000-000000000001')$$, '42501', null, 'anonymous capacity execution is denied');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000001','image',null)$$, '42501', null, 'anonymous creation execution is denied');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select lives_ok($$select * from public.get_gallery_capacity('82000000-0000-0000-0000-000000000001')$$, 'owner can read own capacity');
select throws_ok($$select * from public.get_gallery_capacity('82000000-0000-0000-0000-000000000004')$$, 'P0001', 'gallery_access_denied', 'foreign capacity is denied');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000004','83000000-0000-0000-0000-000000000002','image',null)$$, 'P0001', 'gallery_access_denied', 'foreign mutation is denied');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000003','image','dQw4w9WgXcQ')$$, 'P0001', 'gallery_invalid_data', 'image and YouTube fields cannot coexist');

select lives_ok($$do $body$ begin for i in 1..4 loop perform public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000001', ('83000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid, 'image', null); end loop; end $body$;$$, 'Basic exact image limit succeeds');
select is((select count(*) from public.gallery_items where invitation_id='82000000-0000-0000-0000-000000000001' and type='image'), 4::bigint, 'Basic image count is exact');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000099','image',null)$$, 'P0001', 'gallery_image_limit_reached', 'Basic image limit plus one is rejected');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000098','youtube','dQw4w9WgXcQ')$$, 'P0001', 'gallery_youtube_limit_reached', 'Basic first YouTube is rejected');

select lives_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000002','84000000-0000-0000-0000-000000000001','youtube','dQw4w9WgXcQ')$$, 'Premium exact YouTube limit succeeds');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000002','84000000-0000-0000-0000-000000000002','youtube','M7lc1UVf-VE')$$, 'P0001', 'gallery_youtube_limit_reached', 'Premium YouTube limit plus one is rejected');
select lives_ok($$do $body$ begin for i in 1..6 loop perform public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000002', ('85000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid, 'image', null); end loop; end $body$;$$, 'Premium exact image limit succeeds');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000002','85000000-0000-0000-0000-000000000099','image',null)$$, 'P0001', 'gallery_image_limit_reached', 'Premium image limit plus one is rejected');

select lives_ok($$do $body$ begin for i in 1..2 loop perform public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000003', ('86000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid, 'youtube', case i when 1 then 'dQw4w9WgXcQ' else 'M7lc1UVf-VE' end); end loop; end $body$;$$, 'VIP exact YouTube limit succeeds');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000003','86000000-0000-0000-0000-000000000099','youtube','aqz-KE-bpKQ')$$, 'P0001', 'gallery_youtube_limit_reached', 'VIP YouTube limit plus one is rejected');
select lives_ok($$do $body$ begin for i in 1..10 loop perform public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000003', ('87000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid, 'image', null); end loop; end $body$;$$, 'VIP exact image limit succeeds');
select throws_ok($$select * from public.create_gallery_item_atomic('82000000-0000-0000-0000-000000000003','87000000-0000-0000-0000-000000000099','image',null)$$, 'P0001', 'gallery_image_limit_reached', 'VIP image limit plus one is rejected');

reset role;
update public.themes set is_active=false where id='81000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select lives_ok($$select * from public.get_gallery_capacity('82000000-0000-0000-0000-000000000002')$$, 'inactive referenced theme entitlement resolves');
reset role;
update public.tiers set is_active=false where code='premium';
set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select lives_ok($$select * from public.get_gallery_capacity('82000000-0000-0000-0000-000000000002')$$, 'inactive referenced tier entitlement resolves');
select results_eq($$select max_gallery_images,max_youtube_videos,current_gallery_images,current_youtube_videos from public.get_gallery_capacity('82000000-0000-0000-0000-000000000002')$$, $$values (6,1,6::bigint,1::bigint)$$, 'capacity returns only accurate approved values');

select * from finish();
rollback;
