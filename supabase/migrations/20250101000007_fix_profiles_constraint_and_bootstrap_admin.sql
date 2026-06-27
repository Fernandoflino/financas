-- Fix profiles constraint to properly reference auth.users
-- This migration corrects the FK constraint that was incorrectly created

-- Drop old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recreate constraint pointing to auth.users
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Insert profile for bootstrap admin user (if not exists)
INSERT INTO public.profiles (id, email)
VALUES (
  '6486f7d8-7005-4ee8-97f4-fcf841453d5e',
  'fernandoflino95@gmail.com'
)
ON CONFLICT (id) DO NOTHING;

-- Assign admin role to bootstrap user
INSERT INTO rbac.user_roles (user_id, role_id)
VALUES (
  '6486f7d8-7005-4ee8-97f4-fcf841453d5e',
  (SELECT id FROM rbac.roles WHERE name = 'admin')
)
ON CONFLICT DO NOTHING;
