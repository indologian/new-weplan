begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users(id,email) values
 ('18000000-0000-4000-8000-000000000001','admin-metrics@example.test'),
 ('18000000-0000-4000-8000-000000000002','couple-metrics@example.test');
insert into public.profiles(id,full_name,role) values
 ('18000000-0000-4000-8000-000000000001','Metrics Admin','admin'),
 ('18000000-0000-4000-8000-000000000002','Metrics Couple','couple');
insert into public.themes(id,tier_id,name,slug,thumbnail_path,renderer_key)
select '18100000-0000-4000-8000-000000000001',id,'Metrics Theme','admin-metrics-theme','themes/admin.webp','admin-metrics'
from public.tiers where code='basic';
insert into public.invitations(id,couple_id,theme_id,slug,status) values
 ('18200000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000002','18100000-0000-4000-8000-000000000001','admin-active-test','active'),
 ('18200000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000002','18100000-0000-4000-8000-000000000001','admin-draft-test','draft');
insert into public.transactions(invitation_id,couple_id,midtrans_order_id,status,theme_id_snapshot,theme_name_snapshot,tier_code_snapshot,tier_name_snapshot,price_snapshot,active_months_snapshot) values
 ('18200000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000002','admin-paid-1','paid','18100000-0000-4000-8000-000000000001','Snapshot Theme','basic','Snapshot Tier',10000,3),
 (null,'18000000-0000-4000-8000-000000000002','admin-paid-2','paid','18100000-0000-4000-8000-000000000001','Snapshot Theme','basic','Snapshot Tier',25000,3),
 (null,'18000000-0000-4000-8000-000000000002','admin-pending','pending','18100000-0000-4000-8000-000000000001','Snapshot Theme','basic','Snapshot Tier',90000,3),
 (null,'18000000-0000-4000-8000-000000000002','admin-failed','failed','18100000-0000-4000-8000-000000000001','Snapshot Theme','basic','Snapshot Tier',80000,3),
 (null,'18000000-0000-4000-8000-000000000002','admin-expired','expired','18100000-0000-4000-8000-000000000001','Snapshot Theme','basic','Snapshot Tier',70000,3),
 (null,'18000000-0000-4000-8000-000000000002','admin-cancelled','cancelled','18100000-0000-4000-8000-000000000001','Snapshot Theme','basic','Snapshot Tier',60000,3);

select ok(not has_function_privilege('anon','public.get_admin_overview_metrics()','EXECUTE'),'anon cannot execute overview RPC');
select ok(has_function_privilege('authenticated','public.get_admin_overview_metrics()','EXECUTE'),'authenticated role has narrow RPC grant');
select ok(pg_get_functiondef('public.get_admin_overview_metrics()'::regprocedure) like '%SECURITY DEFINER%','RPC is security definer');
select is((select provolatile from pg_proc where oid='public.get_admin_overview_metrics()'::regprocedure),'s','RPC is stable/read-only');
select ok(pg_get_functiondef('public.get_admin_overview_metrics()'::regprocedure) not like '%UPDATE %','RPC contains no update');
select ok(pg_get_functiondef('public.get_admin_overview_metrics()'::regprocedure) not like '%DELETE %','RPC contains no delete');

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.get_admin_overview_metrics()$$,'42501',null,'unauthenticated execution denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.get_admin_overview_metrics()$$,'P0001','admin_access_denied','couple execution denied');
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000001',true);
select is((select total_paid_revenue from public.get_admin_overview_metrics()),35000::bigint,'revenue sums paid price snapshots only');
select is((select paid_transaction_count from public.get_admin_overview_metrics()),2::bigint,'paid count exact');
select is((select pending_transaction_count from public.get_admin_overview_metrics()),1::bigint,'pending count exact');
select is((select terminal_transaction_count from public.get_admin_overview_metrics()),3::bigint,'terminal count exact');
select is((select active_invitation_count from public.get_admin_overview_metrics()),1::bigint,'active invitation count exact');
reset role;
update public.tiers set price=999999 where code='basic';
set local role authenticated;
select set_config('request.jwt.claim.sub','18000000-0000-4000-8000-000000000001',true);
select is((select total_paid_revenue from public.get_admin_overview_metrics()),35000::bigint,'tier price edit does not alter historical revenue');

select * from finish();
rollback;
