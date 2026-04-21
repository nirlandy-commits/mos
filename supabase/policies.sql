alter table public.profiles enable row level security;
alter table public.measure_entries enable row level security;
alter table public.consumed_meals enable row level security;
alter table public.consumed_food_items enable row level security;
alter table public.plan_meals enable row level security;
alter table public.plan_food_items enable row level security;
alter table public.plan_food_swaps enable row level security;
alter table public.supplements enable row level security;
alter table public.water_entries enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_sessions enable row level security;
alter table public.feedback_entries enable row level security;

create policy "profiles select own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles update own" on public.profiles
for update using (auth.uid() = id);

create policy "profiles insert own" on public.profiles
for insert with check (auth.uid() = id);

create policy "measure entries own" on public.measure_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "consumed meals own" on public.consumed_meals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "consumed food items own" on public.consumed_food_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan meals own" on public.plan_meals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan food items own" on public.plan_food_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan food swaps via owner" on public.plan_food_swaps
for all using (
  exists (
    select 1
    from public.plan_food_items i
    where i.id = plan_food_item_id
      and i.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.plan_food_items i
    where i.id = plan_food_item_id
      and i.user_id = auth.uid()
  )
);

create policy "supplements own" on public.supplements
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "water entries own" on public.water_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training plans own" on public.training_plans
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training sessions own" on public.training_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "feedback own" on public.feedback_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
