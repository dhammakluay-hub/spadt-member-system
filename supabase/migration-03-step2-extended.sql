-- ============================================================
-- SPADT Migration 03 — Step 2 (Sports Info) extended fields
-- ============================================================

alter table public.members
  add column if not exists personnel_type text,
  add column if not exists competition_level text,
  add column if not exists classification_status text,
  add column if not exists classification_date date,
  add column if not exists classifier_name text,
  add column if not exists classification_place text,
  add column if not exists team_province text,
  add column if not exists assistive_devices jsonb default '[]'::jsonb,
  add column if not exists achievements jsonb default '[]'::jsonb;
