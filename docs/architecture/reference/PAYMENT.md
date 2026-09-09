# Payment Reference

## Checkout
Input from browser: `invitationId` only.

Server:
1. require authenticated owner
2. ensure invitation checkoutable
3. resolve theme + tier
4. derive price/duration/limits
5. create immutable transaction snapshot
6. create Midtrans order
7. set invitation `payment_pending`

While pending:
- content editable
- slug editable
- theme/tier locked
- no second checkout while active pending transaction exists

## Webhook
- public endpoint for Midtrans
- verify authenticity/signature/status
- idempotent by `midtrans_order_id`
- browser callback is never source of truth
- paid transition + invitation activation must be atomic

Success:
`expires_at = paid_at + active_months_snapshot`
`delete_after = expires_at + 7 days`

Failed/expired/cancelled:
invitation returns to draft if it has not already been paid.
