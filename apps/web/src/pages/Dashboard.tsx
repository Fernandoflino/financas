import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function DashboardPage() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateProfile({ full_name: fullName })
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Bem-vindo, {profile?.full_name || user?.email}! 👋
              </h2>
              <p className="text-slate-600">Dashboard da Plataforma de Análise de Investimentos</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Email: {user?.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Perfil</h3>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFullName(profile?.full_name || '')
                  }}
                  className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">
                <span className="font-medium text-slate-900">Nome:</span> {profile?.full_name || 'Não definido'}
              </p>
              <p className="text-slate-600">
                <span className="font-medium text-slate-900">Email:</span> {user?.email}
              </p>
              <p className="text-slate-600">
                <span className="font-medium text-slate-900">Membro desde:</span> {new Date(user?.created_at || '').toLocaleDateString('pt-BR')}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Editar perfil
              </button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-slate-900 mb-2">Dashboard</h3>
            <p className="text-slate-600 text-sm">Visualize seu patrimônio e rentabilidade</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">💼</div>
            <h3 className="font-bold text-slate-900 mb-2">Carteiras</h3>
            <p className="text-slate-600 text-sm">Gerencie múltiplas carteiras de investimentos</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-bold text-slate-900 mb-2">IA Inteligente</h3>
            <p className="text-slate-600 text-sm">Obtenha análises baseadas em inteligência artificial</p>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm">
            ℹ️ Fase 1 em progresso: Autenticação e RBAC implementados. Próximas fases: MarketData, Carteiras e Dashboard completo.
          </p>
        </div>
      </main>
    </div>
  )
}
