# Project Structure

```text
weplan/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── create/[themeSlug]/
│   ├── dashboard/couple/
│   ├── dashboard/admin/
│   ├── invitation/[slug]/[guestToken]/
│   └── docs/architecture/api/
├── features/
│   ├── invitation-builder/
│   ├── invitations/
│   ├── guests/
│   ├── rsvp/
│   ├── wishes/
│   ├── payments/
│   └── admin/
├── themes/
├── components/ui/
├── components/layout/
├── components/landing/
├── actions/
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── supabase/admin.ts
│   ├── storage/
│   ├── midtrans/
│   └── auth/
├── validations/
├── types/
├── hooks/
├── styles/tokens.css
├── public/
└── proxy.ts
```

Do not create `src/`.
