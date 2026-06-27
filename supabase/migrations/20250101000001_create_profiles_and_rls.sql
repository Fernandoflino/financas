-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Assign 'user' role to new user
  insert into rbac.user_roles (user_id, role_id)
  select new.id, id from rbac.roles where name = 'user';

  return new;
end;
$$;

-- Trigger event
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS on RBAC tables (read-only for authenticated users)
alter table rbac.roles enable row level security;
alter table rbac.permissions enable row level security;
alter table rbac.role_permissions enable row level security;
alter table rbac.user_roles enable row level security;

-- Allow authenticated users to read roles and permissions
create policy "Authenticated users can read roles"
  on rbac.roles
  for select
  to authenticated
  using (true);

create policy "Authenticated users can read permissions"
  on rbac.permissions
  for select
  to authenticated
  using (true);

create policy "Authenticated users can read their own role assignments"
  on rbac.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Authenticated users can read role-permission mappings"
  on rbac.role_permissions
  for select
  to authenticated
  using (true);

-- RLS on app_admin tables (only admin can write, all authenticated can read certain fields)
alter table app_admin.app_settings enable row level security;
alter table app_admin.ai_config enable row level security;
alter table app_admin.audit_log enable row level security;

-- App settings: readable by all authenticated users
create policy "Authenticated users can read app_settings"
  on app_admin.app_settings
  for select
  to authenticated
  using (true);

-- App settings: only admin can update
create policy "Only admin can update app_settings"
  on app_admin.app_settings
  for update
  using (rbac.has_permission(auth.uid(), 'admin.settings.manage'));

-- AI config: readable by all authenticated users
create policy "Authenticated users can read ai_config"
  on app_admin.ai_config
  for select
  to authenticated
  using (true);

-- AI config: only admin can update
create policy "Only admin can update ai_config"
  on app_admin.ai_config
  for update
  using (rbac.has_permission(auth.uid(), 'admin.ai.config'));

-- Audit log: readable only by admin
create policy "Only admin can read audit_log"
  on app_admin.audit_log
  for select
  using (rbac.has_permission(auth.uid(), 'admin.view_audit'));

-- Audit log: admin can insert
create policy "Only admin can insert audit_log"
  on app_admin.audit_log
  for insert
  with check (rbac.has_permission(auth.uid(), 'admin.view_audit'));

-- Add index on updated_at for profiles
create index idx_profiles_updated_at on public.profiles(updated_at desc);
