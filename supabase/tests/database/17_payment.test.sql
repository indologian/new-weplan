begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users(id,email) values
 ('17000000-0000-4000-8000-000000000001','payment-a@example.test'),
 ('17000000-0000-4000-8000-000000000002','payment-b@example.test');
insert into public.profiles(id,full_name,role) values
 ('17000000-0000-4000-8000-000000000001','Payment A','couple'),
 ('17000000-0000-4000-8000-000000000002','Payment B','couple');
insert into public.themes(id,tier_id,name,slug,thumbnail_path,renderer_key)
select '17100000-0000-4000-8000-000000000001',id,'Payment Theme','payment-theme-test','themes/payment.webp','payment-test'
from public.tiers where code='premium';
insert into public.invitations(id,couple_id,theme_id,slug) values
 ('17200000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000001','17100000-0000-4000-8000-000000000001','payment-owner'),
 ('17200000-0000-4000-8000-000000000002','17000000-0000-4000-8000-000000000002','17100000-0000-4000-8000-000000000001','payment-foreign');

select ok(not has_function_privilege('anon','public.reserve_payment_checkout(uuid)','EXECUTE'),'anon cannot reserve');
select ok(has_function_privilege('authenticated','public.reserve_payment_checkout(uuid)','EXECUTE'),'authenticated can reserve');
select ok(not has_function_privilege('authenticated','public.apply_verified_midtrans_payment(text,text,bigint,text,timestamptz)','EXECUTE'),'authenticated cannot apply webhook facts');
select ok(has_function_privilege('service_role','public.apply_verified_midtrans_payment(text,text,bigint,text,timestamptz)','EXECUTE'),'service role can apply webhook facts');
select ok(pg_get_functiondef('public.reserve_payment_checkout(uuid)'::regprocedure) like '%SECURITY DEFINER%','reservation is security definer');
select ok(pg_get_functiondef('public.reserve_payment_checkout(uuid)'::regprocedure) like '%pg_advisory_xact_lock%','reservation uses advisory lock');

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.reserve_payment_checkout('17200000-0000-4000-8000-000000000001')$$,'42501',null,'unauthenticated reserve denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','17000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.reserve_payment_checkout('17200000-0000-4000-8000-000000000002')$$,'P0001','invitation_not_available','foreign invitation denied');
select lives_ok($$select * from public.reserve_payment_checkout('17200000-0000-4000-8000-000000000001')$$,'eligible owner reserves');
select is((select count(*) from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='pending'),1::bigint,'one pending transaction exists');
select results_eq($$select t.price_snapshot,t.active_months_snapshot from public.transactions t join public.tiers r on r.code=t.tier_code_snapshot where t.invitation_id='17200000-0000-4000-8000-000000000001'$$,$$select price,active_months from public.tiers where code='premium'$$,'snapshot is server authoritative');
select is((select status from public.invitations where id='17200000-0000-4000-8000-000000000001'),'payment_pending','invitation is pending');
select throws_ok($$select * from public.reserve_payment_checkout('17200000-0000-4000-8000-000000000001')$$,'P0001','invitation_not_eligible','duplicate reserve denied');
select lives_ok($$select public.compensate_payment_checkout((select midtrans_order_id from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='pending'))$$,'compensation succeeds');
select is((select status from public.invitations where id='17200000-0000-4000-8000-000000000001'),'draft','compensation returns draft');
reset role;
update public.themes set is_active=false where id='17100000-0000-4000-8000-000000000001';
update public.tiers set is_active=false where code='premium';
set local role authenticated;
select set_config('request.jwt.claim.sub','17000000-0000-4000-8000-000000000001',true);
select lives_ok($$select * from public.reserve_payment_checkout('17200000-0000-4000-8000-000000000001')$$,'inactive referenced theme and tier remain eligible');
reset role;
select is(public.apply_verified_midtrans_payment(
 (select midtrans_order_id from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='pending'),
 'paid',(select price_snapshot from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='pending'),'bank_transfer','2026-09-12T05:00:00Z'
),'applied','first verified payment applies');
select is((select status from public.invitations where id='17200000-0000-4000-8000-000000000001'),'active','invitation activates');
select is((select expires_at from public.invitations where id='17200000-0000-4000-8000-000000000001'),('2026-09-12T05:00:00Z'::timestamptz + make_interval(months=>(select active_months_snapshot from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'))),'expiry uses snapshot months');
select is((select delete_after-expires_at from public.invitations where id='17200000-0000-4000-8000-000000000001'),interval '7 days','delete_after is seven days later');
select is((select paid_at from public.invitations where id='17200000-0000-4000-8000-000000000001'),(select published_at from public.invitations where id='17200000-0000-4000-8000-000000000001'),'published_at equals paid_at');
select is((select count(*) from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'),1::bigint,'exactly one paid transaction exists');
select is((select count(*) from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='failed'),1::bigint,'historical failed transaction remains stored');
select throws_ok($$select public.apply_verified_midtrans_payment((select midtrans_order_id from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'),'paid',1,'bank_transfer','2027-01-01T00:00:00Z')$$,'P0001','amount_mismatch','snapshot amount mismatch is rejected');
select is(public.apply_verified_midtrans_payment((select midtrans_order_id from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'),'paid',(select price_snapshot from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'),'bank_transfer','2027-01-01T00:00:00Z'),'duplicate','duplicate paid application is a no-op');
select is(public.apply_verified_midtrans_payment((select midtrans_order_id from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'),'cancelled',(select price_snapshot from public.transactions where invitation_id='17200000-0000-4000-8000-000000000001' and status='paid'),null,null),'duplicate','late terminal is monotonic no-op');
select is((select status from public.invitations where id='17200000-0000-4000-8000-000000000001'),'active','late terminal cannot regress active invitation');

select * from finish();
rollback;
