-- ============================================================
-- SPADT Diagnostic — ตรวจสอบว่าอะไรมีบ้าง
-- รันใน Supabase SQL Editor เพื่อดูสถานะ
-- ============================================================

select
  -- Tables
  exists(select 1 from information_schema.tables where table_schema='public' and table_name='tickets') as has_tickets,
  exists(select 1 from information_schema.tables where table_schema='public' and table_name='ticket_comments') as has_ticket_comments,
  exists(select 1 from information_schema.tables where table_schema='public' and table_name='email_notifications') as has_email_notifications,
  -- Columns
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='national_id') as profiles_has_nid,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') as profiles_has_email,
  -- Functions
  exists(select 1 from pg_proc where proname='my_role_info') as has_my_role_info,
  exists(select 1 from pg_proc where proname='get_email_by_national_id') as has_get_email_rpc,
  exists(select 1 from pg_proc where proname='check_national_id_exists') as has_check_nid_rpc,
  exists(select 1 from pg_proc where proname='admin_update_role') as has_admin_update_role;
