-- Create schema for admin RPCs first
create schema if not exists admin;
grant usage on schema admin to authenticated;

-- RPC to update app settings
create or replace function admin.update_app_settings(
  p_app_name text default null,
  p_logo_url text default null,
  p_favicon_url text default null,
  p_primary_color text default null,
  p_secondary_color text default null,
  p_theme text default null,
  p_registrations_open boolean default null
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  -- Check admin permission
  if not rbac.has_permission(auth.uid(), 'admin.settings.manage') then
    raise exception 'Unauthorized';
  end if;

  -- Get current state (before)
  select row_to_json(t)::jsonb into v_before
  from app_admin.app_settings t where id = 1;

  -- Update settings
  update app_admin.app_settings
  set
    app_name = coalesce(p_app_name, app_name),
    logo_url = coalesce(p_logo_url, logo_url),
    favicon_url = coalesce(p_favicon_url, favicon_url),
    primary_color = coalesce(p_primary_color, primary_color),
    secondary_color = coalesce(p_secondary_color, secondary_color),
    theme = coalesce(p_theme, theme),
    registrations_open = coalesce(p_registrations_open, registrations_open),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 1;

  -- Get new state (after)
  select row_to_json(t)::jsonb into v_after
  from app_admin.app_settings t where id = 1;

  -- Log to audit
  insert into app_admin.audit_log (actor_user_id, action, entity_type, entity_id, before, after)
  values (auth.uid(), 'app_settings.update', 'app_settings', '1', v_before, v_after);

  return v_after;
end;
$$;

-- RPC to update AI config
create or replace function admin.update_ai_config(
  p_model text default null,
  p_system_prompt text default null,
  p_openrouter_api_key_encrypted text default null,
  p_max_requests_per_user_per_day int default null
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  -- Check admin permission
  if not rbac.has_permission(auth.uid(), 'admin.ai.config') then
    raise exception 'Unauthorized';
  end if;

  -- Get current state (before)
  select row_to_json(t)::jsonb into v_before
  from app_admin.ai_config t where id = 1;

  -- Update config (never return api key!)
  update app_admin.ai_config
  set
    model = coalesce(p_model, model),
    system_prompt = coalesce(p_system_prompt, system_prompt),
    openrouter_api_key_encrypted = coalesce(p_openrouter_api_key_encrypted, openrouter_api_key_encrypted),
    max_requests_per_user_per_day = coalesce(p_max_requests_per_user_per_day, max_requests_per_user_per_day),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 1;

  -- Get new state (after) - exclude api key from response
  select jsonb_set(
    row_to_json(t)::jsonb,
    '{openrouter_api_key_encrypted}',
    '"***REDACTED***"'
  ) into v_after
  from app_admin.ai_config t where id = 1;

  -- Log to audit
  insert into app_admin.audit_log (actor_user_id, action, entity_type, entity_id, before, after)
  values (auth.uid(), 'ai_config.update', 'ai_config', '1', v_before, v_after);

  return v_after;
end;
$$;

-- RPC to update user role
create or replace function admin.update_user_role(
  p_user_id uuid,
  p_role_name text
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_role_id uuid;
  v_old_role text;
  v_new_role text;
begin
  -- Check admin permission
  if not rbac.has_permission(auth.uid(), 'admin.users.manage') then
    raise exception 'Unauthorized';
  end if;

  -- Get role id
  select id into v_role_id from rbac.roles where name = p_role_name;
  if v_role_id is null then
    raise exception 'Role not found';
  end if;

  -- Get old role
  select r.name into v_old_role
  from rbac.user_roles ur
  join rbac.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id
  limit 1;

  -- Update role (delete old, insert new)
  delete from rbac.user_roles where user_id = p_user_id;
  insert into rbac.user_roles (user_id, role_id) values (p_user_id, v_role_id);

  v_new_role := p_role_name;

  -- Log to audit
  insert into app_admin.audit_log (actor_user_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    'user_role.update',
    'auth.users',
    p_user_id::text,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', v_new_role)
  );

  return jsonb_build_object('user_id', p_user_id, 'role', v_new_role);
end;
$$;

-- RPC to toggle user block status
create or replace function admin.toggle_user_block(
  p_user_id uuid,
  p_blocked boolean
)
returns json
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check admin permission
  if not rbac.has_permission(auth.uid(), 'admin.users.manage') then
    raise exception 'Unauthorized';
  end if;

  -- Update user in auth.users (ban_reason = 'blocked' if blocked)
  update auth.users
  set
    ban_reason = case when p_blocked then 'blocked_by_admin' else null end,
    updated_at = now()
  where id = p_user_id;

  -- Log to audit
  insert into app_admin.audit_log (actor_user_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    'user.toggle_block',
    'auth.users',
    p_user_id::text,
    jsonb_build_object('blocked', not p_blocked),
    jsonb_build_object('blocked', p_blocked)
  );

  return jsonb_build_object('user_id', p_user_id, 'blocked', p_blocked);
end;
$$;

-- Expose admin functions
grant execute on function admin.update_app_settings to authenticated;
grant execute on function admin.update_ai_config to authenticated;
grant execute on function admin.update_user_role to authenticated;
grant execute on function admin.toggle_user_block to authenticated;
