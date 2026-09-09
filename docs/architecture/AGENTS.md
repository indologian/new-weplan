# Weplan AI Agent Rules

## Mandatory

1. Kerjakan HANYA task pada `docs/architecture/agent/CURRENT-TASK.md`.
2. Baca `docs/architecture/agent/PROJECT-STATE.md` sebelum coding.
3. Baca hanya `required_context` yang disebut task.
4. Jangan audit seluruh repository kecuali task secara eksplisit memintanya.
5. Jangan membaca seluruh `docs/architecture/SPEC-001-weplan.md` untuk task harian.
6. Jangan mengubah file di luar `allowed_paths`.
7. Jangan mengimplementasikan future task.
8. Jika butuh perubahan di luar scope, tulis BLOCKER; jangan diam-diam memperluas scope.
9. Jangan mengubah keputusan arsitektur tanpa approval.
10. Jalankan acceptance tests task.
11. Update `PROJECT-STATE.md` dan `HANDOFF.md`.
12. STOP setelah current task selesai.

## Context loading

- Level 1, selalu: `AGENTS.md`, `docs/architecture/agent/CURRENT-TASK.md`, `docs/architecture/agent/PROJECT-STATE.md`
- Level 2: current task
- Level 3: hanya docs/architecture/reference/source file yang ditunjuk task
- Level 4, forbidden by default: seluruh SPEC, unrelated tasks, seluruh reference, seluruh repository audit

## Security invariants

- Secret/service credential tidak pernah masuk browser.
- Semua mutation authenticated melakukan server-side ownership/role check.
- Public invitee tidak mendapat direct table access.
- Harga checkout dihitung server.
- Browser payment callback bukan source of truth.
- Token invitee asli tidak boleh masuk log.
- Jangan bypass RLS kecuali server flow yang secara eksplisit memakai privileged client setelah business authorization.

## Definition of Done

- requirement task selesai
- server validation/authorization sesuai scope
- typecheck pass
- lint pass
- relevant tests pass
- tidak ada unrelated file changes
- state + handoff diperbarui

## Database Validation Environment

Preferred:

- Local Supabase.

Official fallback for Weplan:

- Dedicated remote Supabase development project.

Rules:

- Never run destructive validation against production.
- Never commit database credentials.
- If local Supabase is unavailable, use the dedicated remote development project.
