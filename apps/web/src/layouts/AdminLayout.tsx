import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { signOut } = useAuth()

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/settings', label: 'Configurações', icon: '⚙️' },
    { path: '/admin/users', label: 'Usuários', icon: '👥' },
    { path: '/admin/audit', label: 'Auditoria', icon: '📋' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Financeiro Admin</h2>
          <p className="text-slate-400 text-sm">Painel de Administração</p>
        </div>

        <nav className="mt-8 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition ${
                  isActive
                    ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-12 px-6">
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="bg-white shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-900">Painel de Administração</h1>
            <Link to="/dashboard" className="text-blue-600 hover:underline">
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
