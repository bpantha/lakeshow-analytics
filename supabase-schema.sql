-- ============================================================
-- Lake Show Analytics — Supabase Schema
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('coach', 'analyst', 'player')),
  player_id text, -- NBA player ID if role = 'player'
  avatar_url text,
  created_at timestamptz default now()
);

-- Row-level security
alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'analyst')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Development Goals
create table if not exists public.development_goals (
  id uuid primary key default gen_random_uuid(),
  player_id text not null, -- NBA player ID
  created_by uuid references public.profiles(id),
  title text not null,
  description text,
  metric text,
  target_value numeric not null,
  current_value numeric not null default 0,
  baseline_value numeric not null default 0,
  unit text default '',
  deadline date,
  status text not null default 'active' check (status in ('active', 'achieved', 'paused')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.development_goals enable row level security;
create policy "All authenticated users can view goals" on public.development_goals for select using (auth.role() = 'authenticated');
create policy "Coaches and analysts can manage goals" on public.development_goals for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach', 'analyst'))
);

-- Goal Progress Tracking
create table if not exists public.goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.development_goals(id) on delete cascade,
  value numeric not null,
  note text,
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz default now()
);

alter table public.goal_progress enable row level security;
create policy "All authenticated users can view progress" on public.goal_progress for select using (auth.role() = 'authenticated');
create policy "Coaches and analysts can record progress" on public.goal_progress for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach', 'analyst'))
);

-- Coach Notes
create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id),
  author_name text not null,
  subject_type text not null check (subject_type in ('player', 'game', 'opponent')),
  subject_id text not null,
  content text not null,
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coach_notes enable row level security;
create policy "View public notes or own private notes" on public.coach_notes for select using (
  not is_private or author_id = auth.uid()
);
create policy "Coaches and analysts can create notes" on public.coach_notes for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach', 'analyst'))
);
create policy "Authors can update own notes" on public.coach_notes for update using (author_id = auth.uid());
create policy "Authors can delete own notes" on public.coach_notes for delete using (author_id = auth.uid());

-- Scouting Reports
create table if not exists public.scouting_reports (
  id uuid primary key default gen_random_uuid(),
  opponent_team_id integer not null,
  game_date date,
  created_by uuid references public.profiles(id),
  offensive_tendencies text,
  defensive_tendencies text,
  key_players text[] default '{}',
  offensive_rating numeric,
  defensive_rating numeric,
  three_point_rate numeric,
  paint_scoring_rate numeric,
  transition_rate numeric,
  pace_ranking integer,
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.scouting_reports enable row level security;
create policy "All authenticated users can view scouting reports" on public.scouting_reports for select using (auth.role() = 'authenticated');
create policy "Coaches and analysts can manage scouting reports" on public.scouting_reports for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach', 'analyst'))
);

-- Nightly Reports
create table if not exists public.nightly_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  generated_by text not null default 'auto',
  team_summary text,
  player_highlights jsonb default '[]',
  opponent_preview text,
  injury_updates text,
  ai_insights jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.nightly_reports enable row level security;
create policy "All authenticated users can view nightly reports" on public.nightly_reports for select using (auth.role() = 'authenticated');
create policy "Coaches and analysts can create reports" on public.nightly_reports for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('coach', 'analyst'))
);

-- Indexes for performance
create index if not exists idx_development_goals_player on public.development_goals(player_id);
create index if not exists idx_coach_notes_subject on public.coach_notes(subject_type, subject_id);
create index if not exists idx_scouting_reports_opponent on public.scouting_reports(opponent_team_id);
create index if not exists idx_nightly_reports_date on public.nightly_reports(report_date desc);

-- ============================================================
-- Sample data (optional — run separately to seed for testing)
-- ============================================================
-- To create an initial admin/coach user:
-- 1. Sign up via the app
-- 2. Run: UPDATE public.profiles SET role = 'coach' WHERE email = 'your@email.com';
