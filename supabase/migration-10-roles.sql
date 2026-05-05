-- ============================================================
-- SPADT Migration 10 — 3-tier Role System
-- super_admin: edit everything
-- admin: edit system but NOT member personal data (read-only on members)
-- member: edit only own profile
-- ============================================================

-- 1. Update role check to include super_admin (drop staff in favor of new tiers)
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'member'));

-- Migrate existing 'staff' to 'admin'
update public.profiles set role = 'admin' where role = 'staff';

-- Promote the founding user to super_admin
update public.profiles
set role = 'super_admin'
where id = '75a252b2-aa59-42ba-8593-49cd9a385a33';

-- ============================================================
-- 2. Updated RLS for MEMBERS table
-- ============================================================

-- Drop existing policies
drop policy if exists "members_staff_all" on public.members;
drop policy if exists "members_auth_read" on public.members;
drop policy if exists "members_self_read" on public.members;

-- super_admin: full access to all members
create policy "members_super_admin_all" on public.members
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- admin: READ-ONLY on members (cannot edit/delete/approve member data)
create policy "members_admin_read" on public.members
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- member: read + update only their OWN row (matched by national_id from profile)
create policy "members_self_read_own" on public.members
  for select using (
    national_id = (select national_id from profiles where id = auth.uid())
  );

create policy "members_self_update_own" on public.members
  for update using (
    national_id = (select national_id from profiles where id = auth.uid())
  );

-- Anyone authenticated can INSERT (initial registration)
create policy "members_auth_insert" on public.members
  for insert to authenticated with check (true);

-- ============================================================
-- 3. Updated RLS for PROFILES
-- ============================================================
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_self_upsert" on public.profiles;

-- super_admin: full access
create policy "profiles_super_admin_all" on public.profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- admin: read all (to see who has what role) but cannot change roles
create policy "profiles_admin_read" on public.profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- everyone: read + update own profile (cannot change own role)
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles p2 where p2.id = auth.uid()));

create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- ============================================================
-- 4. Updated admin_update_role RPC: only super_admin can change roles
-- ============================================================
create or replace function public.admin_update_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'super_admin') then
    raise exception 'forbidden: super_admin role required';
  end if;
  if p_role not in ('super_admin','admin','member') then
    raise exception 'invalid role: must be super_admin, admin, or member';
  end if;
  insert into profiles(id, role) values (p_user_id, p_role)
  on conflict (id) do update set role = excluded.role;
end; $$;

grant execute on function public.admin_update_role(uuid, text) to authenticated;

-- 5. admin_list_users RPC: super_admin + admin can list users (admin read-only)
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, role text, display_name text,
  created_at timestamptz, last_sign_in_at timestamptz, national_id text
)
language sql security definer set search_path = public
as $$
  select u.id, u.email, p.role, p.display_name, u.created_at, u.last_sign_in_at, p.national_id
  from auth.users u
  left join profiles p on p.id = u.id
  where exists (
    select 1 from profiles where id = auth.uid() and role in ('super_admin','admin')
  )
  order by u.created_at desc;
$$;

grant execute on function public.admin_list_users() to authenticated;

-- 6. RPC: get current user's role + linked member id (for client-side guards)
create or replace function public.my_role_info()
returns table (role text, national_id text, member_id uuid)
language sql security definer set search_path = public
as $$
  select
    p.role,
    p.national_id,
    (select id from members m where m.national_id = p.national_id limit 1) as member_id
  from profiles p
  where p.id = auth.uid()
  limit 1;
$$;

grant execute on function public.my_role_info() to authenticated;
