-- ═══════════════════════════════════════════════
-- DGCC SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- ─── Profiles ───
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'OPERATOR',
  current_xp integer not null default 0,
  total_xp integer not null default 0,
  current_level integer not null default 1,
  rank_name text not null default 'Recruit',
  streak_days integer not null default 0,
  last_active_date date,
  daily_bonus_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'OPERATOR'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── Tasks ───
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  xp integer not null default 20,
  priority text not null default 'med' check (priority in ('high', 'med', 'low')),
  task_type text not null default 'one-time' check (task_type in ('one-time', 'recurring')),
  recurrence text, -- 'daily', 'weekly', or 'mon,wed,fri'
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);

create index idx_tasks_user on public.tasks(user_id);
create index idx_tasks_completed on public.tasks(user_id, completed);


-- ─── Habits ───
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  xp integer not null default 15,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);


-- ─── Habit Logs (one entry per habit per day) ───
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique(habit_id, log_date)
);

alter table public.habit_logs enable row level security;
create policy "Users manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id);

create index idx_habit_logs_habit on public.habit_logs(habit_id, log_date);
create index idx_habit_logs_user on public.habit_logs(user_id, log_date);


-- ─── Rewards ───
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  cost integer not null,
  color text not null default 'teal' check (color in ('teal', 'amber', 'blue')),
  created_at timestamptz not null default now()
);

alter table public.rewards enable row level security;
create policy "Users manage own rewards" on public.rewards for all using (auth.uid() = user_id);


-- ─── XP Ledger (audit trail for all XP changes) ───
create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  source text not null, -- 'task', 'habit', 'daily_bonus', 'reward_spend', 'streak'
  reference_id uuid, -- optional FK to the task/habit/reward
  created_at timestamptz not null default now()
);

alter table public.xp_ledger enable row level security;
create policy "Users read own ledger" on public.xp_ledger for select using (auth.uid() = user_id);
create policy "Users insert own ledger" on public.xp_ledger for insert with check (auth.uid() = user_id);

create index idx_xp_ledger_user on public.xp_ledger(user_id, created_at);


-- ─── Reset daily bonus at midnight UTC ───
-- Run this as a Supabase cron job (pg_cron) or Edge Function
-- update public.profiles set daily_bonus_claimed = false where daily_bonus_claimed = true;


-- ─── Updated_at trigger ───
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
