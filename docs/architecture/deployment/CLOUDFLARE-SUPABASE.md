# Deployment

## Target
Cloudflare Workers + Supabase.

As of Aug 2026 Cloudflare recommends vinext for new Next.js Workers deployments. Treat vinext compatibility as a deployment gate because it is still documented as beta.

Suggested gate:
1. build normal Next.js project
2. run `npx vinext check`
3. resolve compatibility issues
4. initialize/deploy vinext
5. verify Server Components, Server Actions, route handlers, auth cookies, Midtrans webhook, signed Storage flows

## Environment
- local
- production
- optional staging strongly recommended for payment/release validation

## Secrets
Examples:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY (server only)
- MIDTRANS_SERVER_KEY (server only)
- NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
- MIDTRANS_IS_PRODUCTION
- INVITEE_TOKEN_ENCRYPTION_KEY
- CRON_SECRET
- NEXT_PUBLIC_APP_URL

Never expose server secrets with `NEXT_PUBLIC_`.

## Cron
Daily lifecycle:
- active where expires_at <= now -> expired
- expired where delete_after <= now -> delete private assets, then hard delete invitation
- cleanup idempotent and retryable

## Logs
Structured events for payment, activation, expiry, cleanup, storage failure, auth denial.
Never log raw invitee token, encrypted token, secrets, or full signed asset URLs.

## Supabase Environments

Development:
- Local Supabase when available.
- Otherwise dedicated remote Supabase development project.

Production:
- Dedicated Supabase production project.

Development and production must never share the same database.

Destructive migration/reset validation must never run against production.
