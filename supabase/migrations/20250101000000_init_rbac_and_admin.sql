-- Create RBAC schema
create schema if not exists rbac;

-- Roles table
create table rbac.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Permissions table
create table rbac.permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Role-Permission mapping
create table rbac.role_permissions (
  role_id uuid not null references rbac.roles(id) on delete cascade,
  permission_id uuid not null references rbac.permissions(id) on delete cascade,
  primary key (role_id, permission_id),
  created_at timestamptz default now()
);

-- User-Role mapping (connects to auth.users)
create table rbac.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references rbac.roles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, role_id)
);

-- Function to check if user has a specific permission
create function rbac.has_permission(p_user_id uuid, p_permission_code text)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from rbac.user_roles ur
    join rbac.role_permissions rp on rp.role_id = ur.role_id
    join rbac.permissions p on p.id = rp.permission_id
    where ur.user_id = p_user_id and p.code = p_permission_code
  );
$$;

-- Create app_admin schema
create schema if not exists app_admin;

-- App Settings (singleton table with branding/config)
create table app_admin.app_settings (
  id int primary key default 1 check (id = 1),
  app_name text not null default 'Financeiro',
  logo_url text,
  favicon_url text,
  primary_color text default '#0f172a',
  secondary_color text default '#0ea5e9',
  theme text default 'light' check (theme in ('light', 'dark', 'auto')),
  registrations_open boolean default true,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- AI Config (singleton table for OpenRouter configuration)
create table app_admin.ai_config (
  id int primary key default 1 check (id = 1),
  model text not null default 'openai/gpt-oss-120b:free',
  system_prompt text not null default 'Você é um assistente de análise de investimentos. Forneça análises fundamentadas baseadas em dados estruturados da carteira do usuário. Nunca faça promessas de retorno financeiro. Sempre cite os indicadores utilizados e o nível de confiança da análise.',
  openrouter_api_key_encrypted text,
  max_requests_per_user_per_day int default 50,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Audit Log for administrative actions
create table app_admin.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_user_roles_user_id on rbac.user_roles(user_id);
create index idx_user_roles_role_id on rbac.user_roles(role_id);
create index idx_role_permissions_role_id on rbac.role_permissions(role_id);
create index idx_audit_log_actor_user_id on app_admin.audit_log(actor_user_id);
create index idx_audit_log_created_at on app_admin.audit_log(created_at desc);

-- Seed initial roles and permissions
insert into rbac.roles (name, description) values
  ('admin', 'Administrador do sistema'),
  ('user', 'Usuário padrão');

insert into rbac.permissions (code, description) values
  ('admin.settings.manage', 'Gerenciar configurações do aplicativo'),
  ('admin.users.manage', 'Gerenciar usuários'),
  ('admin.ai.config', 'Configurar modelo de IA e prompt'),
  ('admin.view_audit', 'Visualizar logs de auditoria'),
  ('portfolio.create', 'Criar carteiras'),
  ('portfolio.read', 'Ler carteiras'),
  ('portfolio.update', 'Atualizar carteiras'),
  ('portfolio.delete', 'Deletar carteiras'),
  ('portfolio_assets.import', 'Importar ativos para carteira');

-- Map admin role to all admin permissions
insert into rbac.role_permissions (role_id, permission_id)
select r.id, p.id
from rbac.roles r
join rbac.permissions p on p.code like 'admin.%'
where r.name = 'admin';

-- Map user role to basic permissions
insert into rbac.role_permissions (role_id, permission_id)
select r.id, p.id
from rbac.roles r
join rbac.permissions p on p.code in ('portfolio.create', 'portfolio.read', 'portfolio.update', 'portfolio.delete', 'portfolio_assets.import')
where r.name = 'user';
