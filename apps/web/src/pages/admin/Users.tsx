import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  ban_reason: string | null
}

interface UserWithProfile extends User {
  full_name?: string
  role?: string
}

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [hasAccess, setHasAccess] = useState(false)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const canAccess = await hasPermission('admin.users.manage')
        setHasAccess(canAccess)

        if (!canAccess) {
          setError('Acesso negado')
          setLoading(false)
          return
        }

        // Call Edge Function to get all users (with permission check)
        const { data, error: funcError } = await supabase.functions.invoke('admin-list-users')

        if (funcError) throw funcError
        if (!data?.users) throw new Error('No users returned')

        setUsers(data.users)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [hasPermission])

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      setUpdatingUser(userId)
      setSuccess('')
      setError('')

      // @ts-expect-error - RPC call
      const { error: rpcError } = await supabase.rpc('toggle_user_block', {
        p_user_id: userId,
        p_blocked: !isBlocked,
      })

      if (rpcError) throw rpcError

      setSuccess(`Usuário ${!isBlocked ? 'bloqueado' : 'desbloqueado'} com sucesso`)

      // Refresh users
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, ban_reason: !isBlocked ? 'blocked_by_admin' : null } : u
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário')
    } finally {
      setUpdatingUser(null)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!hasAccess) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-900">
          Você não tem permissão para acessar esta página.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Gerenciamento de Usuários</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          ✓ {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Cadastrado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Último acesso</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm text-slate-900">{user.full_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {user.ban_reason ? (
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                      Bloqueado
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      Ativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleBlock(user.id, !!user.ban_reason)}
                    disabled={updatingUser === user.id}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      user.ban_reason
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {updatingUser === user.id
                      ? 'Atualizando...'
                      : user.ban_reason
                        ? 'Desbloquear'
                        : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-slate-600">Nenhum usuário cadastrado.</div>
        )}
      </div>

      <p className="text-sm text-slate-500 mt-4">Total: {users.length} usuário(s)</p>
    </div>
  )
}
