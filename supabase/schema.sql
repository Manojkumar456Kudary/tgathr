-- TGathr MVP schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  event_date date not null,
  event_time text not null,
  location text,
  host_name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_name text not null,
  response text not null check (response in ('yes','maybe','no')),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.rsvps enable row level security;

-- MVP policies: public event reading, event creation, and RSVP submission.
-- Add CAPTCHA/rate limiting and stricter ownership controls before broad production use.
create policy "Public can read events" on public.events for select using (true);
create policy "Public can create events" on public.events for insert with check (true);
create policy "Public can read rsvps" on public.rsvps for select using (true);
create policy "Public can submit rsvps" on public.rsvps for insert with check (true);
