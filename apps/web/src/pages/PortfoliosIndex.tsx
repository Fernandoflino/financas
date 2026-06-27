import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PortfolioService } from '@/lib/services/PortfolioService'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Portfolio } from '@/lib/repositories/PortfolioRepository'

const portfolioSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
  })

  // Load portfolios
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const data = await PortfolioService.getUserPortfolios()
        setPortfolios(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar carteiras')
      } finally {
        setLoading(false)
      }
    }

    loadPortfolios()
  }, [])

  const onSubmit = async (data: PortfolioFormData) => {
    try {
      setCreating(true)
      setError('')
      const result = await PortfolioService.createPortfolio(data.name, data.description)
      if (!result) throw new Error('Falha ao criar carteira')

      // Add new portfolio to list
      const newPortfolio: Portfolio = {
        id: result.portfolio_id,
        user_id: '',
        name: data.name,
        description: data.description,
        currency: 'BRL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setPortfolios((prev) => [newPortfolio, ...prev])
      reset()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar carteira')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Minhas Carteiras</h1>
            <p className="text-slate-600 mt-2">Gerencie suas carteiras de investimentos</p>
          </div>
          <Link
            to="/dashboard"
            className="text-blue-600 hover:underline"
          >
            ← Voltar
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Nova Carteira</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Minha Carteira"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Opcional..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {creating ? 'Criando...' : 'Criar Carteira'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Nova Carteira
          </button>
        )}

        {/* Portfolios List */}
        {portfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-slate-600 mb-4">Você ainda não tem nenhuma carteira.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Criar Primeira Carteira
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                to={`/portfolios/${portfolio.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2">{portfolio.name}</h3>
                {portfolio.description && (
                  <p className="text-slate-600 text-sm mb-4">{portfolio.description}</p>
                )}
                <div className="text-xs text-slate-500">
                  Criado em {new Date(portfolio.created_at).toLocaleDateString('pt-BR')}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-900">
            <strong>💡 Próximos passos:</strong> Crie uma carteira e adicione seus ativos. A plataforma integrará
            cotações em tempo real via cache para melhor performance.
          </p>
        </div>
      </div>
    </div>
  )
}
