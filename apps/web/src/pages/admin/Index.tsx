import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalUsers: number
  activeUsers: number
  recentActions: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get users via Edge Function
        const { data: usersRes } = await supabase.functions.invoke('admin-list-users')
        const usersData = usersRes?.users || []

        // Get recent audit logs
        const { data: logsData } = (await (supabase as any)
          .from('audit_log')
          .select('id')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())) as any

        const activeCount = usersData.filter((u: any) => !u.ban_reason).length

        setStats({
          totalUsers: usersData.length,
          activeUsers: activeCount,
          recentActions: logsData?.length || 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const cards = [
    {
      title: 'Total de Usuários',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: 'bg-blue-100 text-blue-800',
      link: '/admin/users',
    },
    {
      title: 'Usuários Ativos',
      value: stats?.activeUsers || 0,
      icon: '✅',
      color: 'bg-green-100 text-green-800',
      link: '/admin/users',
    },
    {
      title: 'Ações Recentes (7d)',
      value: stats?.recentActions || 0,
      icon: '📋',
      color: 'bg-purple-100 text-purple-800',
      link: '/admin/audit',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Bem-vindo ao Painel Admin 👋</h1>
        <p className="text-slate-600 mt-2">Gerencie sua plataforma de análise de investimentos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className={`${card.color} rounded-lg p-6 shadow hover:shadow-lg transition`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{card.title}</p>
                <p className="text-4xl font-bold mt-2">{loading ? '...' : card.value}</p>
              </div>
              <span className="text-5xl">{card.icon}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link
            to="/admin/settings"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium"
          >
            ⚙️ Configurações
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium"
          >
            👥 Gerenciar Usuários
          </Link>
          <Link
            to="/admin/audit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium"
          >
            📋 Ver Auditoria
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-center font-medium"
          >
            🏠 Dashboard
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-900">
          <strong>ℹ️ Fase 2 em progresso:</strong> Painel de admin com configurações, gerenciamento de usuários e auditoria
          implementados. Próxima fase: MarketData, Carteiras e Dashboard completo.
        </p>
      </div>
    </div>
  )
}
