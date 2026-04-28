create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  estimated_minutes integer default 45,
  exercises jsonb not null default '[]'::jsonb,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  completed_at timestamptz not null default now(),
  plan_id uuid references public.training_plans(id) on delete set null,
  plan_name text,
  duration_seconds integer default 0,
  exercises_completed integer default 0,
  series_completed integer default 0,
  volume_total numeric(10,2) default 0,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.training_plans enable row level security;
alter table public.training_sessions enable row level security;

drop policy if exists "training plans own" on public.training_plans;
create policy "training plans own" on public.training_plans
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "training sessions own" on public.training_sessions;
create policy "training sessions own" on public.training_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_training_plans_user on public.training_plans(user_id, sort_order);
create index if not exists idx_training_sessions_user_date on public.training_sessions(user_id, entry_date desc);
