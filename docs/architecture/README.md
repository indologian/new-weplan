# Weplan Architecture Handoff

Dokumentasi implementasi MVP Weplan — SaaS undangan pernikahan digital.

## Cara menggunakan

### Untuk manusia
Mulai dari `docs/architecture/SPEC-001-weplan.md`, lalu gunakan dokumen di `docs/architecture/reference/` sebagai detail teknis.

### Untuk AI coding agent
JANGAN membaca seluruh spesifikasi. Mulai dari:
1. `AGENTS.md`
2. `docs/architecture/agent/CURRENT-TASK.md`
3. `docs/architecture/agent/PROJECT-STATE.md`
4. task yang ditunjuk
5. hanya `required_context` dari task tersebut

Agent harus berhenti setelah current task selesai.

## Stack

- Next.js App Router, TypeScript, tanpa `src/`
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- Motion for React
- Supabase PostgreSQL/Auth/Private Storage
- Midtrans Snap
- Cloudflare Workers
- Target biaya: free-tier / zero fixed monthly infrastructure cost untuk MVP, di luar biaya transaksi, domain, dan biaya yang memang tidak dapat dihindari.

> Catatan deployment 2026: Cloudflare merekomendasikan vinext untuk project Next.js baru di Workers. Jalankan compatibility check dan jangan mengasumsikan semua Next.js API 100% kompatibel.
