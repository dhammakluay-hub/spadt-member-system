-- ============================================================
-- SPADT Migration 08 — Email Notifications Queue + Support Tickets
-- ============================================================

-- 1. Email notifications queue
create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  to_name text,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  member_id uuid references public.members(id) on delete set null,
  trigger text,
  error text,
  created_at timestamptz default now(),
  sent_at timestamptz
);
create index if not exists email_notifications_status_idx on public.email_notifications(status);
create index if not exists email_notifications_created_idx on public.email_notifications(created_at desc);

alter table public.email_notifications enable row level security;
drop policy if exists "email_notif_admin" on public.email_notifications;
create policy "email_notif_admin" on public.email_notifications for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
);

-- 2. Auto-enqueue email when member status changes
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

-- 3. Support tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no serial unique,
  subject text not null,
  description text not null,
  category text default 'general' check (category in ('general','bug','feature','data','account','other')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  assignee_id uuid references auth.users(id) on delete set null,
  related_member_id uuid references public.members(id) on delete set null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);
create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_created_idx on public.tickets(created_at desc);

alter table public.tickets enable row level security;
drop policy if exists "tickets_create" on public.tickets;
create policy "tickets_create" on public.tickets for insert to authenticated with check (true);
drop policy if exists "tickets_read" on public.tickets;
create policy "tickets_read" on public.tickets for select using (
  reporter_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
);
drop policy if exists "tickets_update" on public.tickets;
create policy "tickets_update" on public.tickets for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
);

-- 4. Ticket comments thread
create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_email text,
  body text not null,
  internal_note boolean default false,
  created_at timestamptz default now()
);
create index if not exists ticket_comments_ticket_idx on public.ticket_comments(ticket_id, created_at);

alter table public.ticket_comments enable row level security;
drop policy if exists "comments_select" on public.ticket_comments;
create policy "comments_select" on public.ticket_comments for select using (
  exists (select 1 from public.tickets t where t.id = ticket_id and (
    t.reporter_id = auth.uid() or
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','staff'))
  ))
);
drop policy if exists "comments_insert" on public.ticket_comments;
create policy "comments_insert" on public.ticket_comments for insert to authenticated with check (true);
