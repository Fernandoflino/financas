// RBAC Types
export interface Role {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  code: string
  description?: string
  created_at: string
  updated_at: string
}

// Admin Config Types
export interface AppSettings {
  id: number
  app_name: string
  logo_url?: string
  favicon_url?: string
  primary_color: string
  secondary_color: string
  theme: 'light' | 'dark' | 'auto'
  registrations_open: boolean
  updated_at: string
  updated_by?: string
}

export interface AIConfig {
  id: number
  model: string
  system_prompt: string
  max_requests_per_user_per_day: number
  updated_at: string
  updated_by?: string
}

// Audit Log Types
export interface AuditLog {
  id: string
  actor_user_id: string
  action: string
  entity_type?: string
  entity_id?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// User Profile Type (será criado na Fase 1)
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}
