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

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  audience text not null default 'all' check (audience in ('all', 'email', 'user')),
  user_id uuid references auth.users(id) on delete cascade,
  target_email text,
  title text not null,
  message text not null,
  type text not null default 'Aviso'
);

alter table public.app_notifications enable row level security;

drop policy if exists "Users can read app notifications" on public.app_notifications;
create policy "Users can read app notifications"
  on public.app_notifications
  for select
  to authenticated
  using (
    audience = 'all'
    or user_id = auth.uid()
    or lower(target_email) = lower(auth.jwt() ->> 'email')
  );

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

create index if not exists app_notifications_created_at_idx
  on public.app_notifications (created_at desc);

create index if not exists app_notifications_target_email_idx
  on public.app_notifications (lower(target_email));
