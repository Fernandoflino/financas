-- Fix: Expose non-public schema functions and tables via public schema bridges
-- This migration creates thin wrapper functions and views so PostgREST can reach them
-- Problem: Client code calls supabase.rpc('has_permission', ...) but the function lives in rbac.has_permission
-- Solution: Create public.has_permission that delegates to rbac.has_permission

-- ============================================================================
-- 1. WRAPPER FUNCTIONS (delegate to schema-qualified originals)
-- ============================================================================

-- Wrap rbac.has_permission
create or replace function public.has_permission(p_user_id uuid, p_permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select rbac.has_permission(p_user_id, p_permission_code);
$$;

grant execute on function public.has_permission to authenticated;

-- Wrap admin.update_app_settings
create or replace function public.update_app_settings(
  p_app_name text default null,
  p_logo_url text default null,
  p_favicon_url text default null,
  p_primary_color text default null,
  p_secondary_color text default null,
  p_theme text default null,
  p_registrations_open boolean default null
)
returns json
language sql
security definer
set search_path = public
as $$
  select admin.update_app_settings(
    p_app_name,
    p_logo_url,
    p_favicon_url,
    p_primary_color,
    p_secondary_color,
    p_theme,
    p_registrations_open
  );
$$;

grant execute on function public.update_app_settings to authenticated;

-- Wrap admin.update_ai_config
create or replace function public.update_ai_config(
  p_model text default null,
  p_system_prompt text default null,
  p_openrouter_api_key_encrypted text default null,
  p_max_requests_per_user_per_day int default null
)
returns json
language sql
security definer
set search_path = public
as $$
  select admin.update_ai_config(
    p_model,
    p_system_prompt,
    p_openrouter_api_key_encrypted,
    p_max_requests_per_user_per_day
  );
$$;

grant execute on function public.update_ai_config to authenticated;

-- Wrap admin.update_user_role
create or replace function public.update_user_role(
  p_user_id uuid,
  p_role_name text
)
returns json
language sql
security definer
set search_path = public
as $$
  select admin.update_user_role(p_user_id, p_role_name);
$$;

grant execute on function public.update_user_role to authenticated;

-- Wrap admin.toggle_user_block
create or replace function public.toggle_user_block(
  p_user_id uuid,
  p_blocked boolean
)
returns json
language sql
security definer
set search_path = public
as $$
  select admin.toggle_user_block(p_user_id, p_blocked);
$$;

grant execute on function public.toggle_user_block to authenticated;

-- Wrap market_data.get_or_fetch
create or replace function public.get_or_fetch(
  p_provider_code text,
  p_data_type text,
  p_ticker text,
  p_ttl_seconds int default 3600
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select market_data.get_or_fetch(p_provider_code, p_data_type, p_ticker, p_ttl_seconds);
$$;

grant execute on function public.get_or_fetch to authenticated;

-- Wrap market_data.set_cache
create or replace function public.set_cache(
  p_provider_code text,
  p_data_type text,
  p_ticker text,
  p_payload jsonb,
  p_ttl_seconds int default 3600
)
returns void
language sql
security definer
set search_path = public
as $$
  select market_data.set_cache(p_provider_code, p_data_type, p_ticker, p_payload, p_ttl_seconds);
$$;

grant execute on function public.set_cache to authenticated;

-- Wrap market_data.cleanup_expired
create or replace function public.cleanup_expired()
returns int
language sql
security definer
set search_path = public
as $$
  select market_data.cleanup_expired();
$$;

grant execute on function public.cleanup_expired to authenticated;

-- ============================================================================
-- 2. VIEWS (expose non-public tables via public schema with RLS intact)
-- ============================================================================

-- Expose app_admin.app_settings
create or replace view public.app_settings with (security_invoker = true) as
  select * from app_admin.app_settings;

grant select on public.app_settings to authenticated;

-- Expose app_admin.audit_log
create or replace view public.audit_log with (security_invoker = true) as
  select * from app_admin.audit_log;

grant select on public.audit_log to authenticated;

-- Expose rbac.user_roles with flattened role names
create or replace view public.user_roles_flat with (security_invoker = true) as
  select ur.user_id, r.name as role_name
  from rbac.user_roles ur
  join rbac.roles r on r.id = ur.role_id;

grant select on public.user_roles_flat to authenticated;
