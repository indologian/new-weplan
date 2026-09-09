# Repository Layout

Recommended project layout:

```text
weplan/
├── AGENTS.md
├── app/
├── components/
├── features/
├── themes/
├── actions/
├── lib/
├── validations/
├── types/
├── hooks/
├── styles/
├── public/
├── supabase/
├── package.json
├── tsconfig.json
├── next.config.ts
├── proxy.ts
└── docs/
    └── architecture/
        ├── AGENTS.md
        ├── README.md
        ├── SPEC-001-weplan.md
        ├── agent/
        ├── tasks/
        ├── reference/
        ├── database/
        ├── diagrams/
        ├── api/
        ├── frontend/
        ├── security/
        ├── deployment/
        ├── backup/
        └── implementation/
```

`docs/architecture/database/*.sql` adalah reference/specification SQL.
Migration runtime yang dibuat oleh Task 02 harus berada di `supabase/migrations/`.
