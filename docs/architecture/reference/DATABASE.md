# Database Reference

Source of truth for implementation is `docs/architecture/database/schema.sql`.

## Key rules
- UUID primary keys.
- `invitations.slug` globally unique.
- At most one main wedding event per invitation.
- At most one paid transaction per non-deleted invitation.
- RSVP and wish use composite FK `(invitation_id, guest_id)` to prevent cross-invitation corruption.
- `transactions.invitation_id` is nullable with `ON DELETE SET NULL`.
- Commercial snapshot is immutable historical data.
- Account numbers are text.
- Tier media limits must be enforced server-side.
