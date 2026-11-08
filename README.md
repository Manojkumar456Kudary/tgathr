# TGathr

**Bring your people together.** A free-to-start event invitation and RSVP platform built with Next.js and Supabase.

## Features
- Responsive landing page
- Create and publish events
- Shareable event pages
- RSVP: Going / Maybe / Can't go
- Supabase-backed event and RSVP storage
- Works as a static export on Cloudflare Pages

## 1. Supabase setup
1. Create a free project at https://supabase.com.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. In Project Settings → API, copy the Project URL and `anon` / publishable key.

## 2. Local setup
```bash
npm install
cp .env.example .env.local
```
Fill `.env.local` with your Supabase URL and anon key, then:
```bash
npm run dev
```

## 3. Cloudflare Pages deployment
1. Push this repository to GitHub.
2. In Cloudflare Dashboard choose Workers & Pages → Create → Pages → Connect to Git.
3. Select the `tgathr` repository.
4. Build command: `npm run build`
5. Build output directory: `out`
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Deploy. Cloudflare will assign a `*.pages.dev` address.

## Important
This is an MVP starter, not a hardened production service. Before broad public use, add CAPTCHA/rate limiting, email verification, moderation, privacy policy, backups, and review/strengthen database policies. Do not commit `.env.local` or secret keys.

Static export means event data and RSVP functionality are handled by Supabase from the browser. No Next.js server routes are used.
