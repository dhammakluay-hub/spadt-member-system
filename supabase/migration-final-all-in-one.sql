-- ============================================================
-- SPADT FINAL MIGRATION — All-in-one (idempotent)
-- รัน SQL นี้เพียงครั้งเดียวที่:
-- https://supabase.com/dashboard/project/dtfgbzvhtxidlbcmukcb/sql/new
-- รวม migrations 8 + 9 + 10 + super_admin lock + บั๊กฟิกซ์ทั้งหมด
-- ============================================================

-- ===== Email notifications =====
create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  to_email text not null, to_name text, subject text not null, body text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  member_id uuid references public.members(id) on delete set null,
  trigger text, error text,
  created_at timestamptz default now(), sent_at timestamptz
);
alter table public.email_notifications enable row level security;
drop policy if exists "email_notif_admin" on public.email_notifications;
create policy "email_notif_admin" on public.email_notifications for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('super_admin','admin'))
);

create or replace function public.enqueue_member_status_email()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status and new.email is not null then
    if new.status = 'approved' then
      insert into public.email_notifications(to_email, to_name, subject, body, member_id, trigger)
      values (new.email, new.first_name||' '||new.last_name,
              'SPADT Thailand — ใบสมัครสมาชิกของคุณได้รับการอนุมัติแล้ว',
              E'เรียน คุณ '||new.first_name||' '||new.last_name||E'\n\nใบสมัครสมาชิกของท่านได้รับการอนุมัติแล้ว\nรหัสสมาชิก: '||coalesce(new.member_code, substring(new.id::text, 1, 8))||E'\n\nสมาคมกีฬาคนพิการแห่งประเทศไทย (SPADT)',
              new.id, 'member_approved');
    elsif new.status = 'rejected' then
      insert into public.email_notifications(to_email, to_name, subject, body, member_id, trigger)
      values (new.email, new.first_name||' '||new.last_name,
              'SPADT Thailand — แจ้งผลการพิจารณาใบสมัครสมาชิก',
              E'เรียน คุณ '||new.first_name||' '||new.last_name||E'\n\nใบสมัครของท่านยังไม่ผ่านการพิจารณา หากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่\n\nสมาคมกีฬาคนพิการแห่งประเทศไทย (SPADT)',
              new.id, 'member_rejected');
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists members_status_email on public.members;
create trigger members_status_email after update on public.members
  for each row execute function public.enqueue_member_status_email();

-- ===== Tickets =====
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no serial unique,
  subject text not null, description text not null,
  category text default 'general' check (category in ('general','bug','feature','data','account','other')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  assignee_id uuid references auth.users(id) on delete set null,
  related_member_id uuid references public.members(id) on delete set null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  resolved_at timestamptz
);
alter table public.tickets enable row level security;
drop policy if exists "tickets_create" on public.tickets;
create policy "tickets_create" on public.tickets for insert to authenticated with check (true);
drop policy if exists "tickets_read" on public.tickets;
create policy "tickets_read" on public.tickets for select using (
  reporter_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('super_admin','admin'))
);
drop policy if exists "tickets_update" on public.tickets;
create policy "tickets_update" on public.tickets for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('super_admin','admin'))
);

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_email text, body text not null,
  internal_note boolean default false,
  created_at timestamptz default now()
);
alter table public.ticket_comments enable row level security;
drop policy if exists "comments_select" on public.ticket_comments;
create policy "comments_select" on public.ticket_comments for select using (
  exists (select 1 from public.tickets t where t.id = ticket_id and (
    t.reporter_id = auth.uid() or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('super_admin','admin'))
  ))
);
drop policy if exists "comments_insert" on public.ticket_comments;
create policy "comments_insert" on public.ticket_comments for insert to authenticated with check (true);

-- ===== Profiles: add national_id + email + new role check =====
alter table public.profiles add column if not exists national_id text;
alter table public.profiles add column if not exists email text;

create unique index if not exists profiles_national_id_key on public.profiles(national_id) where national_id is not null;
create index if not exists profiles_email_idx on public.profiles(email);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('super_admin','admin','member'));

-- Migrate legacy 'staff' → 'admin'
update public.profiles set role = 'admin' where role = 'staff';

-- ===== Lock super_admin to ONLY mkongruang@gmail.com =====
-- Step 1: ensure mkongruang@gmail.com is super_admin
update public.profiles
set role = 'super_admin'
where id = '75a252b2-aa59-42ba-8593-49cd9a385a33';

-- Step 2: any OTHER super_admin gets demoted to admin (lock invariant)
update public.profiles
set role = 'admin'
where role = 'super_admin'
  and id <> '75a252b2-aa59-42ba-8593-49cd9a385a33';

-- ===== Auth signup: handle_new_user fills national_id + email =====
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
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill emails for existing auth users
insert into public.profiles (id, role, email)
select u.id, 'member', u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

update public.profiles p set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ===== RPC: get_email_by_national_id (for login + forgot-password) =====
create or replace function public.get_email_by_national_id(p_national_id text)
returns text language sql security definer set search_path = public as $$
  select email from public.profiles where national_id = p_national_id limit 1;
$$;
grant execute on function public.get_email_by_national_id(text) to anon, authenticated;

-- ===== RPC: check_national_id_exists (signup duplicate check) =====
create or replace function public.check_national_id_exists(p_national_id text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.members where national_id = p_national_id
    union all
    select 1 from public.profiles where national_id = p_national_id
  );
$$;
grant execute on function public.check_national_id_exists(text) to anon, authenticated;

-- ===== RPC: my_role_info =====
create or replace function public.my_role_info()
returns table (role text, national_id text, member_id uuid)
language sql security definer set search_path = public as $$
  select p.role, p.national_id,
    (select id from members m where m.national_id = p.national_id limit 1)
  from profiles p where p.id = auth.uid() limit 1;
$$;
grant execute on function public.my_role_info() to authenticated;

-- ===== RPC: admin_list_users =====
create or replace function public.admin_list_users()
returns table (id uuid, email text, role text, display_name text,
               created_at timestamptz, last_sign_in_at timestamptz, national_id text)
language sql security definer set search_path = public as $$
  select u.id, u.email, p.role, p.display_name, u.created_at, u.last_sign_in_at, p.national_id
  from auth.users u
  left join profiles p on p.id = u.id
  where exists (select 1 from profiles where id = auth.uid() and role in ('super_admin','admin'))
  order by u.created_at desc;
$$;
grant execute on function public.admin_list_users() to authenticated;

-- ===== RPC: admin_update_role — ONLY mkongruang@gmail.com can grant super_admin =====
create or replace function public.admin_update_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_caller_email text;
  v_caller_role text;
begin
  -- Resolve caller
  select u.email, p.role into v_caller_email, v_caller_role
  from auth.users u
  left join profiles p on p.id = u.id
  where u.id = auth.uid();

  -- Only super_admin can change roles at all
  if v_caller_role <> 'super_admin' then
    raise exception 'forbidden: only super_admin can change roles';
  end if;

  -- Only mkongruang@gmail.com can promote/demote others
  if v_caller_email <> 'mkongruang@gmail.com' then
    raise exception 'forbidden: only the founding super_admin (mkongruang@gmail.com) can manage roles';
  end if;

  -- Validation
  if p_role not in ('super_admin','admin','member') then
    raise exception 'invalid role: must be super_admin, admin, or member';
  end if;

  -- Cannot promote anyone else to super_admin (super_admin is locked to mkongruang@gmail.com)
  if p_role = 'super_admin' and p_user_id <> '75a252b2-aa59-42ba-8593-49cd9a385a33'::uuid then
    raise exception 'super_admin role is locked to mkongruang@gmail.com only';
  end if;

  -- Cannot demote self
  if p_user_id = auth.uid() and p_role <> 'super_admin' then
    raise exception 'cannot demote yourself';
  end if;

  insert into profiles(id, role) values (p_user_id, p_role)
  on conflict (id) do update set role = excluded.role;
end; $$;
grant execute on function public.admin_update_role(uuid, text) to authenticated;

-- ===== RLS for members (3-tier) =====
drop policy if exists "members_staff_all" on public.members;
drop policy if exists "members_auth_read" on public.members;
drop policy if exists "members_self_read" on public.members;
drop policy if exists "members_super_admin_all" on public.members;
drop policy if exists "members_admin_read" on public.members;
drop policy if exists "members_self_read_own" on public.members;
drop policy if exists "members_self_update_own" on public.members;
drop policy if exists "members_auth_insert" on public.members;

create policy "members_super_admin_all" on public.members
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

create policy "members_admin_read" on public.members
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "members_self_read_own" on public.members
  for select using (national_id = (select national_id from profiles where id = auth.uid()));

create policy "members_self_update_own" on public.members
  for update using (national_id = (select national_id from profiles where id = auth.uid()));

create policy "members_auth_insert" on public.members
  for insert to authenticated with check (true);

-- ===== RLS for profiles (3-tier) =====
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_self_upsert" on public.profiles;
drop policy if exists "profiles_super_admin_all" on public.profiles;
drop policy if exists "profiles_admin_read" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;

create policy "profiles_super_admin_all" on public.profiles
  for all using (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'super_admin'));

create policy "profiles_admin_read" on public.profiles
  for select using (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());

create policy "profiles_self_insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- ============================================================
-- DONE — ระบบพร้อมใช้งาน Production
-- ============================================================
