-- RehabProtocol AI — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default 'User',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Protocols table (saved rehab protocols)
create table if not exists public.protocols (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  injury_name text not null,
  protocol_data jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.protocols enable row level security;

create policy "Users can view own protocols"
  on public.protocols for select
  using (auth.uid() = user_id);

create policy "Users can insert own protocols"
  on public.protocols for insert
  with check (auth.uid() = user_id);

create policy "Users can update own protocols"
  on public.protocols for update
  using (auth.uid() = user_id);

create policy "Users can delete own protocols"
  on public.protocols for delete
  using (auth.uid() = user_id);

create index idx_protocols_user_id on public.protocols (user_id);

-- 3. Progress logs table
create table if not exists public.progress_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  protocol_id uuid references public.protocols on delete cascade not null,
  pain_score integer not null check (pain_score between 0 and 10),
  rom_score integer not null check (rom_score between 0 and 100),
  completed_exercises boolean not null default false,
  notes text not null default '',
  pain_location text,
  workout_details jsonb,
  created_at timestamptz not null default now()
);

alter table public.progress_logs enable row level security;

create policy "Users can view own logs"
  on public.progress_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.progress_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.progress_logs for delete
  using (auth.uid() = user_id);

create index idx_progress_logs_user_id on public.progress_logs (user_id);
create index idx_progress_logs_protocol_id on public.progress_logs (protocol_id);
