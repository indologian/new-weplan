-- Atomic payment reservation, compensation, and verified state application.
-- Executable source: supabase/migrations/20260912170000_task17_payment.sql

-- Signature: public.reserve_payment_checkout(p_invitation_id uuid)
-- Authenticates with auth.uid(), verifies invitation ownership, serializes by
-- invitation advisory lock, resolves persisted theme/tier commercial values
-- (including inactive catalog rows), snapshots them, inserts one pending
-- transaction, and changes the invitation from draft to payment_pending.
-- Revoked from PUBLIC/anon and granted only to authenticated.

-- Signature: public.compensate_payment_checkout(p_midtrans_order_id text)
-- Authenticates ownership and idempotently fails only the matching effective
-- pending transaction. It restores payment_pending to draft only when no paid
-- or other effective pending transaction exists.
-- Revoked from PUBLIC/anon and granted only to authenticated.

-- Signature: public.apply_verified_midtrans_payment(
--   p_order_id text, p_target_status text, p_gross_amount bigint,
--   p_payment_type text, p_paid_at timestamptz
-- )
-- Accepts only server-verified payment facts, serializes by invitation, checks
-- the immutable price snapshot, and applies monotonic transaction/invitation
-- state. First paid activation atomically writes lifecycle timestamps using
-- active_months_snapshot. Terminal state cannot regress paid/active state.
-- Revoked from PUBLIC/anon/authenticated and granted only to service_role.

-- All functions are SECURITY DEFINER with an empty search_path and fully
-- qualified application relations. The pending and paid partial unique indexes
-- remain database-level final authorities.
