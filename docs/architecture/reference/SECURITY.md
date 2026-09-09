# Security Reference

## Access layers
1. Authenticated couple/admin: Supabase SSR session + RLS + explicit server authorization.
2. Invitee: Next.js server endpoint/component validates token and lifecycle, then privileged server client.
3. Midtrans/Cron: protected server-only endpoints + privileged client.

## Invitee token
- random >= 128 bits
- URL contains raw token
- DB lookup uses SHA-256 hash
- encrypted copy stored for dashboard Copy Link
- AES-GCM using server-only `INVITEE_TOKEN_ENCRYPTION_KEY`
- regeneration replaces both hash/encrypted value and invalidates old link
- never log raw/encrypted token

## Payment
Never accept price/tier snapshot from browser. Never activate from Snap browser callback.

## Defense in depth
frontend validation -> server validation -> ownership/role -> RLS -> DB constraints.
