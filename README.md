# AfterLife Web App

AfterLife is a private long-distance web app for Mo and Aysel. It is now a React + Vite + TypeScript PWA with a Supabase-backed couple-space flow.

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Without Supabase env vars, the app runs in local-device mode using browser storage. The older local JSON API bridge is still available after a build:

```powershell
npm.cmd run build
npm.cmd run serve:api
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Restart `npm.cmd run dev`.

The first shared flow is:

- Sign up or sign in.
- Create a couple space.
- Copy the invite code.
- Sign in as the second user and join with the code.
- Memories, list ideas, reading notes, and preferences sync between both users.

## Scripts

```powershell
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check
npm.cmd run check:api
```

## Deployment Notes

Vercel should use:

- Build command: `npm run build`
- Output directory: `dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Also add the Vercel production and preview URLs in Supabase Auth redirect URL settings before sharing it.
