create or replace function public.get_admin_overview_metrics()
returns table(
  total_paid_revenue bigint,
  paid_transaction_count bigint,
  pending_transaction_count bigint,
  terminal_transaction_count bigint,
  active_invitation_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or not exists (
    select 1
    from public.profiles profile
    where profile.id = caller_id
      and profile.role = 'admin'
  ) then
    raise exception using errcode = 'P0001', message = 'admin_access_denied';
  end if;

  return query
  select
    coalesce(sum(payment.price_snapshot) filter (where payment.status = 'paid'), 0)::bigint,
    count(*) filter (where payment.status = 'paid')::bigint,
    count(*) filter (where payment.status = 'pending')::bigint,
    count(*) filter (where payment.status in ('failed', 'expired', 'cancelled'))::bigint,
    (select count(*) from public.invitations invitation where invitation.status = 'active')::bigint
  from public.transactions payment;
end;
$$;

revoke all on function public.get_admin_overview_metrics() from public, anon, authenticated;
grant execute on function public.get_admin_overview_metrics() to authenticated;
