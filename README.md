# TGathr — Cloudflare Pages edition

An open-source event invitation and RSVP platform starter. TGathr is an independent brand and implementation; it does not use Partiful's name, logo, source code, or proprietary assets.

## Included

- Responsive event discovery landing page
- Supabase magic-link sign-in
- Create and publish events
- Shareable invitation links (`/event?slug=your-event-slug`)
- RSVP responses (Yes / Maybe / No)
- Owner/admin dashboard (`/admin`)
- Supabase PostgreSQL schema and Row Level Security policies
- Static export configured for Cloudflare Pages

## Free deployment on Cloudflare Pages

1. Create a free Supabase project at https://supabase.com.
2. In Supabase → SQL Editor, run `supabase/schema.sql`.
3. In Supabase → Authentication → URL Configuration, add `http://localhost:3000` and your final `https://tgather.pages.dev` URL to the allowed redirect URLs.
4. Create a GitHub repository in your own account and upload/push this project.
5. In Cloudflare, open Workers & Pages → Create application → Pages → Import an existing Git repository.
6. Select the repository and configure:
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npx next build`
   - Build output directory: `out`
   - Production branch: `main`
7. Add these environment variables in the Cloudflare Pages project settings (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/public key
8. Save and deploy. Choose the project name `tgather` if Cloudflare shows it as available. The resulting address should be `https://tgather.pages.dev`.
9. In Supabase Auth URL Configuration, set the Site URL to `https://tgather.pages.dev` and include it in the redirect allow list.

Cloudflare Pages project names are subject to availability. The `pages.dev` address is not reserved until the project is successfully created.

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and anon/public key.
3. Run `npm install` then `npm run dev`.
4. Open http://localhost:3000.

## Make yourself the owner

1. Sign in on the deployed site using the email address you want to own/administer it with.
2. In Supabase → SQL Editor, run this statement, replacing the email:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'you@example.com';
   ```

3. Open `/admin` while signed in.

Keep the Supabase project under an account you control. Never expose a Supabase service-role key in browser code.

## Important before public launch

This is a functional MVP starter, not a hardened production service. Before inviting the public, address the security items in particular: public RSVP email exposure, CAPTCHA/rate limiting, email verification, guest data privacy, host-only guest exports, moderation, privacy policy, terms, backups, and data retention. Review the supplied RLS policies carefully before using real guest data.

## License

MIT. See `LICENSE`.
