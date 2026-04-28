create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
  on public.user_roles
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles current_role
      where current_role.user_id = auth.uid()
        and current_role.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles current_role
      where current_role.user_id = auth.uid()
        and current_role.role = 'admin'
    )
  );

insert into public.user_roles (user_id, role)
select id, 'admin'
from public.profiles
where lower(email) in (
  'nirlandy@gmail.com',
  'nirlandy@gmail.com.br',
  'nirlandy.pinheiro@gmail.com',
  'pinheironirla@gmail.com'
)
on conflict (user_id) do update set role = excluded.role, updated_at = now();

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.profiles
  alter column calorie_target set default 2400,
  alter column water_target_ml set default 3000;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_weight_range_check'
  ) then
    alter table public.profiles
      add constraint profiles_weight_range_check check (weight is null or (weight >= 0 and weight <= 500));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_target_weight_range_check'
  ) then
    alter table public.profiles
      add constraint profiles_target_weight_range_check check (target_weight is null or (target_weight >= 0 and target_weight <= 500));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_height_range_check'
  ) then
    alter table public.profiles
      add constraint profiles_height_range_check check (height is null or (height > 0 and height <= 300));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_calorie_target_range_check'
  ) then
    alter table public.profiles
      add constraint profiles_calorie_target_range_check check (calorie_target >= 0 and calorie_target <= 10000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_water_target_range_check'
  ) then
    alter table public.profiles
      add constraint profiles_water_target_range_check check (water_target_ml >= 0 and water_target_ml <= 10000);
  end if;
end $$;

update public.consumed_food_items
set calories = coalesce(calories, 0),
    protein = coalesce(protein, 0),
    carbs = coalesce(carbs, 0),
    fat = coalesce(fat, 0);

alter table public.consumed_food_items
  alter column calories set default 0,
  alter column calories set not null,
  alter column protein set default 0,
  alter column protein set not null,
  alter column carbs set default 0,
  alter column carbs set not null,
  alter column fat set default 0,
  alter column fat set not null;

update public.plan_food_items
set calories = coalesce(calories, 0),
    protein = coalesce(protein, 0),
    carbs = coalesce(carbs, 0),
    fat = coalesce(fat, 0);

alter table public.plan_food_items
  alter column calories set default 0,
  alter column calories set not null,
  alter column protein set default 0,
  alter column protein set not null,
  alter column carbs set default 0,
  alter column carbs set not null,
  alter column fat set default 0,
  alter column fat set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'consumed_food_items_macros_non_negative_check'
  ) then
    alter table public.consumed_food_items
      add constraint consumed_food_items_macros_non_negative_check check (
        calories >= 0 and calories <= 10000 and
        protein >= 0 and protein <= 1000 and
        carbs >= 0 and carbs <= 1000 and
        fat >= 0 and fat <= 1000
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'plan_food_items_macros_non_negative_check'
  ) then
    alter table public.plan_food_items
      add constraint plan_food_items_macros_non_negative_check check (
        calories >= 0 and calories <= 10000 and
        protein >= 0 and protein <= 1000 and
        carbs >= 0 and carbs <= 1000 and
        fat >= 0 and fat <= 1000
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'water_entries_amount_ml_check'
  ) then
    alter table public.water_entries
      add constraint water_entries_amount_ml_check check (amount_ml > 0 and amount_ml <= 5000);
  end if;
end $$;

create unique index if not exists idx_water_entries_user_date_time_unique
  on public.water_entries(user_id, entry_date, entry_time);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'training_sessions_plan_id_fkey'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_plan_id_fkey
      foreign key (plan_id)
      references public.training_plans(id)
      on delete set null;
  end if;
end $$;

drop policy if exists "MOS admins can create app notifications" on public.app_notifications;
create policy "MOS admins can create app notifications"
  on public.app_notifications
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );

create index if not exists idx_consumed_food_items_user
  on public.consumed_food_items(user_id);

create index if not exists idx_plan_food_items_user
  on public.plan_food_items(user_id);

create index if not exists idx_plan_food_swaps_plan_food_item
  on public.plan_food_swaps(plan_food_item_id);

create index if not exists idx_feedback_entries_user_created
  on public.feedback_entries(user_id, created_at desc);

create index if not exists idx_training_sessions_plan_id
  on public.training_sessions(plan_id);

create index if not exists idx_user_roles_role
  on public.user_roles(role);
