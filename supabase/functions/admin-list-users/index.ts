import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichedUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  ban_reason: string | null
  full_name?: string | null
  role?: string
}

export default async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    // Get caller's auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Create client for caller context (to check permissions)
    const callerClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''))

    // Get current user
    const { data: { user: currentUser }, error: userError } = await callerClient.auth.getUser()
    if (userError || !currentUser) {
      throw new Error('Not authenticated')
    }

    // Check permission: admin.users.manage
    const { data: hasPermission, error: permError } = await callerClient.rpc('has_permission', {
      p_user_id: currentUser.id,
      p_permission_code: 'admin.users.manage',
    })

    if (permError || !hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin.users.manage permission required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Switch to service role to get all users (permissions already checked above)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users via admin API
    const { data: { users }, error: usersError } = await serviceClient.auth.admin.listUsers()
    if (usersError) {
      throw usersError
    }

    // Get profiles
    const { data: profilesData, error: profilesError } = await serviceClient
      .from('profiles')
      .select('id, full_name')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Get user roles
    const { data: rolesData, error: rolesError } = await (serviceClient as any)
      .from('user_roles_flat')
      .select('user_id, role_name')

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
    }

    // Create lookup maps
    const profileMap = Object.fromEntries(
      profilesData?.map((p: any) => [p.id, p.full_name]) || []
    )
    const roleMap = Object.fromEntries(
      rolesData?.map((r: any) => [r.user_id, r.role_name]) || []
    )

    // Enrich users
    const enrichedUsers: EnrichedUser[] = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      ban_reason: u.ban_reason || null,
      full_name: profileMap[u.id],
      role: roleMap[u.id],
    }))

    return new Response(
      JSON.stringify({
        users: enrichedUsers,
        totalCount: enrichedUsers.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Admin list users error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}
