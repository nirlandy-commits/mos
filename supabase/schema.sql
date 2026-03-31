create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  city text,
  birth_date date,
  goal text,
  plan_focus text,
  plan_notes text,
  weight numeric(5,2),
  target_weight numeric(5,2),
  height numeric(5,2),
  age integer,
  calorie_target integer default 0,
  water_target_ml integer default 3000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.measure_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  weight numeric(5,2) not null,
  body_fat numeric(5,2),
  muscle_mass numeric(5,2),
  body_water numeric(5,2),
  height numeric(5,2),
  metabolic_age integer,
  created_at timestamptz not null default now()
);

create table if not exists public.consumed_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  title text not null,
  description text,
  meal_time time,
  created_at timestamptz not null default now()
);

create table if not exists public.consumed_food_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.consumed_meals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  quantity_label text,
  grams numeric(7,2),
  calories numeric(7,2) default 0,
  protein numeric(7,2) default 0,
  carbs numeric(7,2) default 0,
  fat numeric(7,2) default 0,
  benefit_text text,
  source_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_food_items (
  id uuid primary key default gen_random_uuid(),
  plan_meal_id uuid not null references public.plan_meals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  quantity_label text,
  grams numeric(7,2),
  calories numeric(7,2) default 0,
  protein numeric(7,2) default 0,
  carbs numeric(7,2) default 0,
  fat numeric(7,2) default 0,
  benefit_text text,
  recommendation_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_food_swaps (
  id uuid primary key default gen_random_uuid(),
  plan_food_item_id uuid not null references public.plan_food_items(id) on delete cascade,
  name text not null,
  quantity_label text,
  notes text
);

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text,
  quantity text,
  preferred_time time,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  amount_ml integer not null,
  entry_time time not null,
  label text default 'Água',
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  section text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_measure_entries_user_date on public.measure_entries(user_id, entry_date desc);
create index if not exists idx_consumed_meals_user_date on public.consumed_meals(user_id, entry_date desc);
create index if not exists idx_consumed_food_items_meal on public.consumed_food_items(meal_id);
create index if not exists idx_plan_meals_user on public.plan_meals(user_id, sort_order);
create index if not exists idx_plan_food_items_plan on public.plan_food_items(plan_meal_id);
create index if not exists idx_supplements_user on public.supplements(user_id);
create index if not exists idx_water_entries_user_date on public.water_entries(user_id, entry_date desc);
