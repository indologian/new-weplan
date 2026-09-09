# Constraint Notes

`schema.sql` already contains CHECK/FK/UNIQUE constraints.
`indexes.sql` contains partial unique indexes.

Application/server invariants not expressible safely as simple static checks:
- slug change forbidden once invitation is active/expired
- theme/tier locked while payment_pending
- gallery/video count limited by resolved tier
- only verified payment path activates invitation
- transaction snapshots are immutable after creation
