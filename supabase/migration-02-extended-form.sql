-- ============================================================
-- SPADT Migration 02 — Extended Registration Form
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- 1. เพิ่ม columns สำหรับฟอร์มขยาย (multi-education, expanded work)
alter table public.members
  add column if not exists educations jsonb default '[]'::jsonb,
  add column if not exists work_organization_type text,
  add column if not exists disability_employment_article text,
  add column if not exists work_start_year text;

-- 2. สร้าง Storage bucket สำหรับรูปสมาชิก + passport
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

-- 3. Policies สำหรับ bucket (authenticated upload, public read)
drop policy if exists "member_photos_auth_upload" on storage.objects;
create policy "member_photos_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-photos');

drop policy if exists "member_photos_auth_update" on storage.objects;
create policy "member_photos_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-photos');

drop policy if exists "member_photos_public_read" on storage.objects;
create policy "member_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'member-photos');
