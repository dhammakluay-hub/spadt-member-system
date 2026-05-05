-- ============================================================
-- SPADT Migration 04 — Step 3 (Documents + Consent)
-- ============================================================

alter table public.members
  add column if not exists documents jsonb default '[]'::jsonb,
  add column if not exists consent_pdpa boolean default false,
  add column if not exists consent_terms boolean default false,
  add column if not exists consent_images boolean default false,
  add column if not exists signed_at timestamptz,
  add column if not exists additional_notes text;

-- Index for audit trails
create index if not exists members_signed_at_idx on public.members(signed_at);
