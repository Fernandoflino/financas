import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface AuditEntry {
  id: string
  actor_user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  created_at: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export default function AuditLogPage() {
  const { hasPermission } = useAuth()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [hasAccess, setHasAccess] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const canAccess = await hasPermission('admin.view_audit')
        setHasAccess(canAccess)

        if (!canAccess) {
          setError('Acesso negado')
          setLoading(false)
          return
        }

        const { data, error: fetchError } = (await supabase
          .from('audit_log' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)) as any

        if (fetchError) throw fetchError
        setLogs(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar logs')
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [hasPermission])

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
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Log de Auditoria</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Data/Hora</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ação</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tipo Entidade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ID Entidade</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.action}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{log.entity_type || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">{log.entity_id || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedId === log.id ? 'Ocultar' : 'Ver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="p-8 text-center text-slate-600">Nenhum log de auditoria encontrado.</div>
        )}
      </div>

      {/* Expanded Details */}
      {expandedId && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div>
            {(() => {
              const log = logs.find((l) => l.id === expandedId)
              if (!log) return null

              return (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Detalhes da Ação</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600">Ação:</p>
                      <p className="font-mono text-slate-900">{log.action}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tipo Entidade:</p>
                      <p className="font-mono text-slate-900">{log.entity_type || '-'}</p>
                    </div>
                    {log.before && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Estado Anterior (Before):</p>
                        <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto text-slate-900">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Estado Posterior (After):</p>
                        <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto text-slate-900">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
