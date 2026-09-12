create unique index if not exists one_pending_transaction_per_invitation
on public.transactions(invitation_id)
where status = 'pending' and invitation_id is not null;

create or replace function public.reserve_payment_checkout(p_invitation_id uuid)
returns table(midtrans_order_id text, gross_amount bigint)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_invitation public.invitations%rowtype;
  v_theme public.themes%rowtype;
  v_tier public.tiers%rowtype;
  v_order_id text := 'weplan-' || gen_random_uuid()::text;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('payment:' || p_invitation_id::text, 0));
  select * into v_invitation from public.invitations where id = p_invitation_id for update;
  if not found or v_invitation.couple_id <> v_user then raise exception 'invitation_not_available'; end if;
  if v_invitation.status <> 'draft' then raise exception 'invitation_not_eligible'; end if;
  if exists(select 1 from public.transactions t where t.invitation_id=p_invitation_id and t.status in ('pending','paid')) then
    raise exception 'payment_already_exists';
  end if;
  select * into v_theme from public.themes where id=v_invitation.theme_id;
  if not found then raise exception 'theme_not_available'; end if;
  select * into v_tier from public.tiers where id=v_theme.tier_id;
  if not found then raise exception 'tier_not_available'; end if;
  insert into public.transactions(
    invitation_id,couple_id,midtrans_order_id,status,theme_id_snapshot,theme_name_snapshot,
    tier_code_snapshot,tier_name_snapshot,price_snapshot,active_months_snapshot
  ) values (
    p_invitation_id,v_user,v_order_id,'pending',v_theme.id,v_theme.name,
    v_tier.code,v_tier.name,v_tier.price,v_tier.active_months
  );
  update public.invitations set status='payment_pending',updated_at=now()
  where id=p_invitation_id and status='draft';
  if not found then raise exception 'invitation_state_changed'; end if;
  return query select v_order_id,v_tier.price;
end;
$$;

create or replace function public.compensate_payment_checkout(p_midtrans_order_id text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_tx public.transactions%rowtype;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  select * into v_tx from public.transactions where midtrans_order_id=p_midtrans_order_id;
  if not found or v_tx.couple_id<>v_user or v_tx.invitation_id is null then raise exception 'transaction_not_available'; end if;
  perform pg_advisory_xact_lock(hashtextextended('payment:' || v_tx.invitation_id::text, 0));
  select * into v_tx from public.transactions where midtrans_order_id=p_midtrans_order_id for update;
  if v_tx.status <> 'pending' then return; end if;
  update public.transactions set status='failed',updated_at=now() where id=v_tx.id and status='pending';
  update public.invitations i set status='draft',updated_at=now()
  where i.id=v_tx.invitation_id and i.status='payment_pending'
    and not exists(select 1 from public.transactions t where t.invitation_id=i.id and t.status in ('pending','paid'));
end;
$$;

create or replace function public.apply_verified_midtrans_payment(
  p_order_id text,p_target_status text,p_gross_amount bigint,p_payment_type text,p_paid_at timestamptz
)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_tx public.transactions%rowtype; v_expiry timestamptz;
begin
  if p_target_status not in ('pending','paid','failed','expired','cancelled') then raise exception 'invalid_target_status'; end if;
  select * into v_tx from public.transactions where midtrans_order_id=p_order_id;
  if not found or v_tx.invitation_id is null then return 'unknown'; end if;
  perform pg_advisory_xact_lock(hashtextextended('payment:' || v_tx.invitation_id::text, 0));
  select * into v_tx from public.transactions where id=v_tx.id for update;
  if v_tx.price_snapshot<>p_gross_amount then raise exception 'amount_mismatch'; end if;
  if v_tx.status='paid' then return 'duplicate'; end if;
  if p_target_status='paid' then
    if p_paid_at is null then raise exception 'paid_at_required'; end if;
    v_expiry := p_paid_at + make_interval(months => v_tx.active_months_snapshot);
    update public.transactions set status='paid',payment_type=p_payment_type,paid_at=p_paid_at,updated_at=now() where id=v_tx.id;
    update public.invitations set status='active',paid_at=p_paid_at,published_at=p_paid_at,
      expires_at=v_expiry,delete_after=v_expiry+interval '7 days',updated_at=now()
    where id=v_tx.invitation_id
      and (
        (v_tx.status='pending' and status='payment_pending')
        or (
          v_tx.status in ('failed','expired','cancelled')
          and status='draft'
          and not exists(
            select 1 from public.transactions other
            where other.invitation_id=v_tx.invitation_id
              and other.id<>v_tx.id
              and other.status in ('pending','paid')
          )
        )
      );
    if not found then raise exception 'invitation_state_changed'; end if;
    return 'applied';
  end if;
  if v_tx.status<>'pending' then return 'ignored'; end if;
  if p_target_status='pending' then return 'duplicate'; end if;
  update public.transactions set status=p_target_status,payment_type=coalesce(p_payment_type,payment_type),updated_at=now() where id=v_tx.id;
  update public.invitations i set status='draft',updated_at=now()
  where i.id=v_tx.invitation_id and i.status='payment_pending'
    and not exists(select 1 from public.transactions t where t.invitation_id=i.id and t.status in ('pending','paid'));
  return 'applied';
end;
$$;

revoke all on function public.reserve_payment_checkout(uuid) from public, anon, authenticated;
grant execute on function public.reserve_payment_checkout(uuid) to authenticated;
revoke all on function public.compensate_payment_checkout(text) from public, anon, authenticated;
grant execute on function public.compensate_payment_checkout(text) to authenticated;
revoke all on function public.apply_verified_midtrans_payment(text,text,bigint,text,timestamptz) from public, anon, authenticated;
grant execute on function public.apply_verified_midtrans_payment(text,text,bigint,text,timestamptz) to service_role;
