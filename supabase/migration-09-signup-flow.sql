-- ============================================================
-- SPADT Migration 09 — Signup flow (national_id as username)
-- - Add national_id + email columns to profiles
-- - Update handle_new_user trigger to copy national_id from user_metadata
-- - Add RPC `get_email_by_national_id` so /login can lookup email
-- ============================================================

-- 1. Extend profiles
alter table public.profiles
  add column if not exists national_id text,
  add column if not exists email text;

create unique index if not exists profiles_national_id_key on public.profiles(national_id) where national_id is not null;
create index if not exists profiles_email_idx on public.profiles(email);

-- 2. Updated trigger: copy national_id from user_metadata on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, national_id, email)
  values (
    new.id,
    'member',
    new.raw_user_meta_data->>'national_id',
    new.email
  )
  on conflict (id) do update set
    national_id = coalesce(public.profiles.national_id, excluded.national_id),
    email = coalesce(public.profiles.email, excluded.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. RPC for /login: lookup email by national_id (used when user enters NID instead of email)
create or replace function public.get_email_by_national_id(p_national_id text)
returns text
language sql security definer set search_path = public
as $$
  select email from public.profiles where national_id = p_national_id limit 1;
$$;

grant execute on function public.get_email_by_national_id(text) to anon, authenticated;

-- 4. Update check_national_id_exists to also check profiles (signup duplicates)
create or replace function public.check_national_id_exists(p_national_id text)
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.members where national_id = p_national_id
    union all
    select 1 from public.profiles where national_id = p_national_id
  );
$$;

grant execute on function public.check_national_id_exists(text) to anon, authenticated;

-- 5. Backfill profiles with email for existing auth users (one-time)
insert into public.profiles (id, role, email)
select u.id, 'member', u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
