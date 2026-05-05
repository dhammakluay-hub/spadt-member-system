-- ============================================================
-- SPADT Thailand — Member Management System
-- Supabase SQL schema
-- Run once in Supabase SQL editor.
-- ============================================================

-- ---- profiles ----
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','staff','member')),
  display_name text,
  created_at timestamptz default now()
);

-- ---- members ----
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  member_code text unique,
  first_name text not null,
  last_name text not null,
  nickname text,
  national_id text,
  birth_date date,
  gender text,
  phone text,
  email text,
  address text,
  province text,
  district text,
  subdistrict text,
  postal_code text,
  disability_type text,
  sport_code text,
  classification_code text,
  photo_url text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists members_status_idx on public.members(status);
create index if not exists members_sport_idx on public.members(sport_code);
create index if not exists members_province_idx on public.members(province);

-- ---- sports (reference) ----
create table if not exists public.sports (
  code text primary key,
  name_th text not null,
  name_en text not null
);

-- ---- classifications (reference) ----
create table if not exists public.classifications (
  code text primary key,
  sport text not null,
  description text
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.sports enable row level security;
alter table public.classifications enable row level security;

-- Profiles: user can read own profile
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Members: staff/admin can do everything, member can see own
drop policy if exists "members_staff_all" on public.members;
create policy "members_staff_all" on public.members
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','staff'))
  );

drop policy if exists "members_self_read" on public.members;
create policy "members_self_read" on public.members
  for select using (email = auth.email());

-- Reference tables: public read
drop policy if exists "sports_public_read" on public.sports;
create policy "sports_public_read" on public.sports for select using (true);

drop policy if exists "classifications_public_read" on public.classifications;
create policy "classifications_public_read" on public.classifications for select using (true);

-- ============================================================
-- Trigger to auto-populate profiles on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'member')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storage bucket for member photos
-- (also create manually via dashboard: Storage → New bucket → "member-photos" (public))
-- ============================================================
