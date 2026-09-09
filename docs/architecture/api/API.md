# API / Mutation Reference

## Route handlers
- `GET /docs/architecture/api/invitations/slug-availability?slug=...`
- `GET /docs/architecture/api/invite/[guestToken]/rsvp`
- `PUT /docs/architecture/api/invite/[guestToken]/rsvp`
- `GET /docs/architecture/api/invite/[guestToken]/wishes`
- `PUT /docs/architecture/api/invite/[guestToken]/wish`
- `POST /docs/architecture/api/payments/checkout`
- `POST /docs/architecture/api/payments/midtrans/notification`
- `POST /docs/architecture/api/cron/cleanup-expired`

## Server Actions
Authenticated couple/admin CRUD should prefer Server Actions:
- invitations
- events/stories/gallery/gifts
- guests
- admin themes/tiers/homepage visibility

## Public invitation
`/invitation/[slug]/[guestToken]` is a Server Component route, not a public database API.

Never accept `guestId`, `invitationId`, owner ID, or price from invitee requests when those can be derived server-side.
