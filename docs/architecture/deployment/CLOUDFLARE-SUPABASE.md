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

The Worker has one native Cron Trigger at `0 19 * * *` (19:00 UTC / 02:00 Asia/Jakarta the following day). Its custom entry preserves vinext request handling and invokes the same lifecycle service as `POST /api/cron/cleanup-expired`. The HTTP route requires `Authorization: Bearer <CRON_SECRET>` and fails closed when the secret is absent.

Initial safety caps are 50 expiry candidates, 3 deletion candidates, 8 Storage list requests per invitation per run, and 1000 discovered paths per bulk removal. Incomplete traversal retains the invitation row for retry.

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

## Cloudflare operator checklist

- Configure `SUPABASE_SECRET_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `INVITEE_TOKEN_ENCRYPTION_KEY`, and `CRON_SECRET` as encrypted Worker secrets, never plaintext Wrangler variables.
- Supply browser-safe `NEXT_PUBLIC_*` values to the appropriate build/runtime environment without committing values.
- Validate the existing Next.js build and vinext build.
- Apply and record approved Supabase migrations; Task 19 adds no migration or RLS change.
- Follow the backup/restore SOP before production changes.
- Configure the domain, Supabase Auth Site URL/redirect URLs, Google OAuth callback, and Midtrans Notification URL.
- Confirm the Cron Trigger, then test native scheduled execution and the authorized HTTP fallback.
- Smoke-test auth, dashboards, builder/review, public invitation, RSVP/Wishes, checkout sandbox, webhook reachability, and private signed assets without a real production payment.
- Scan built client assets for server-only secret names or values before release.
