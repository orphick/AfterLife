# AfterLife Supabase Setup

## 1. Create The Project

Create a Supabase project from the dashboard. Keep the database password somewhere private.

## 2. Apply The Schema

Open Supabase SQL Editor, create a new query, paste `supabase/schema.sql`, and run it.

This creates:

- Auth-owned profiles
- Couple spaces and invite-code joining
- Space membership
- Shared memories, lists, reading items, progress, and notes
- RLS policies so users only access spaces they belong to
- Realtime publication entries for shared tables

## 3. Add Local Env Vars

Copy `.env.example` to `.env.local` and fill values from Supabase Project Settings > API:

```powershell
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Never commit `.env.local`.

## 4. Configure Auth URLs

In Supabase Authentication > URL Configuration, add the local development URL:

```text
http://127.0.0.1:5173
http://127.0.0.1:5175
```

When Vercel is connected, add the production URL and preview URL pattern too.

## 5. Verify Backend Wiring

Run:

```powershell
npm.cmd run check:supabase
```

This verifies the auth endpoint, table access shape, and that couple-space RPCs reject anonymous calls.

Then start the app:

```powershell
npm.cmd run dev
```

Test with two accounts:

1. Mo signs up or signs in.
2. Mo creates a couple space and copies the invite code.
3. Aysel signs up or signs in.
4. Aysel joins with the invite code.
5. Save a memory from one account and confirm it appears in the other.

For a repeatable command-line smoke test, create or confirm two Supabase Auth accounts, add these values to `.env.local`, and run `npm.cmd run smoke:supabase`:

```powershell
AFTERLIFE_SMOKE_EMAIL_1=mo@example.com
AFTERLIFE_SMOKE_PASSWORD_1=your-password
AFTERLIFE_SMOKE_EMAIL_2=aysel@example.com
AFTERLIFE_SMOKE_PASSWORD_2=your-password
```

Optional third-account RLS check:

```powershell
AFTERLIFE_SMOKE_OUTSIDER_EMAIL=outsider@example.com
AFTERLIFE_SMOKE_OUTSIDER_PASSWORD=your-password
```

## Production Notes

Keep email confirmation enabled for production. For quick local testing, you can temporarily disable email confirmations in Supabase Auth settings, but turn it back on before sharing the app outside local development.
