# SPADT Thailand — Member Management System

ระบบจัดการสมาชิก สมาคมกีฬาคนพิการแห่งประเทศไทย (SPADT)
Full-Stack: **Next.js 16 + TypeScript + Tailwind CSS + Supabase**

## Quick Start

```bash
# Load nvm (first time per shell)
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

# Dev server
npm run dev
# → http://localhost:3000
```

## Project Structure

```
spadt-member-system/
├── app/                    # Next.js App Router pages
│   ├── login/              # Login page
│   ├── dashboard/          # Statistics dashboard
│   ├── members/            # Member list + search
│   ├── register/           # 3-step registration form
│   ├── pending/            # Approval workflow
│   ├── cards/              # QR-code member cards
│   ├── reports/            # Reports + Excel export
│   ├── classification/     # IPC/IF 167 codes
│   └── settings/           # System settings
├── components/
│   ├── AppShell.tsx        # Sidebar + Header wrapper
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── MemberCard.tsx      # QR-code card UI
│   └── RegistrationForm/   # Step1/Step2/Step3
├── lib/
│   ├── supabase.ts         # Supabase client (browser + SSR)
│   ├── auth.ts             # Auth helpers
│   ├── api.ts              # MemberAPI · StorageAPI · ExportAPI
│   └── constants.ts        # Sports · Classifications · Provinces
├── middleware.ts           # Auth guard
└── .env.local              # Supabase credentials (gitignored)
```

## Environment Variables

See `.env.local` — contains Supabase URL + anon key carried over from the legacy
`sports_member_system_supabase.html`.

## Supabase Schema (expected)

The frontend expects these tables. Create them in Supabase SQL editor:

```sql
-- profiles: role mapping for auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','staff','member')),
  created_at timestamptz default now()
);

-- members: registration records
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

-- RLS
alter table public.members enable row level security;
alter table public.profiles enable row level security;

create policy "Admin/Staff read all" on public.members
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
  );

create policy "Admin/Staff write" on public.members
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
  );

create policy "User read own profile" on public.profiles
  for select using (id = auth.uid());
```

Then create Storage bucket `member-photos` (public).

## Migration Phases

- [x] **Phase 1** — Project structure + Supabase connection
- [ ] **Phase 2** — Core features (Dashboard / Members / Registration / Approval / Cards) — stubs ready, needs DB
- [ ] **Phase 3** — Advanced features + Vercel deploy
- [ ] **Phase 4** — Testing + training + go-live

## Deploy (Vercel)

```bash
git init && git add . && git commit -m "Initial commit"
# Push to GitHub, connect to Vercel, set env vars, deploy
```

## License

Prepared for Maitree Kongruang · SPADT Thailand
