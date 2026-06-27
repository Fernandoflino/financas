import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PortfolioService } from '@/lib/services/PortfolioService'
import { PortfolioImportModal } from '@/components/PortfolioImportModal'
import { AIAnalysisModal } from '@/components/AIAnalysisModal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const assetSchema = z.object({
  ticker: z.string().min(1, 'Ticker obrigatório').toUpperCase(),
  quantity: z.coerce.number().positive('Quantidade deve ser positiva'),
  averagePrice: z.coerce.number().positive('Preço médio deve ser positivo'),
  category: z.string().optional(),
})

type AssetFormData = z.infer<typeof assetSchema>

export default function PortfolioDetailPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [dataSourceId, setDataSourceId] = useState<string>('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
  })

  // Load portfolio details
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!portfolioId) return
      try {
        const data = await PortfolioService.getPortfolioWithDetails(portfolioId)
        if (!data) {
          setError('Carteira não encontrada')
          return
        }
        setPortfolio(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar carteira')
      } finally {
        setLoading(false)
      }
    }

    loadPortfolio()
  }, [portfolioId])

  const onAddAsset = async (data: AssetFormData) => {
    if (!portfolioId) return
    try {
      setAdding(true)
      setError('')
      const result = await PortfolioService.addAsset(
        portfolioId,
        data.ticker,
        data.quantity,
        data.averagePrice,
        data.category
      )
      if (!result) throw new Error('Falha ao adicionar ativo')

      // Reload portfolio
      const updated = await PortfolioService.getPortfolioWithDetails(portfolioId)
      if (updated) setPortfolio(updated)

      reset()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar ativo')
    } finally {
      setAdding(false)
    }
  }

  const handleImportComplete = async () => {
    setShowImportModal(false)
    // Reload portfolio
    const updated = await PortfolioService.getPortfolioWithDetails(portfolioId!)
    if (updated) setPortfolio(updated)
  }

  const openImportModal = () => {
    if (!portfolio || !portfolio.dataSources || portfolio.dataSources.length === 0) return
    const manualSource = portfolio.dataSources.find((ds: any) => ds.provider === 'manual')
    if (manualSource) {
      setDataSourceId(manualSource.id)
      setShowImportModal(true)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!portfolio) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <Link to="/portfolios" className="text-blue-600 hover:underline mt-4 block">
          ← Voltar às carteiras
        </Link>
      </div>
    )
  }

  const { summary, assets } = portfolio

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/portfolios" className="text-blue-600 hover:underline mb-4 block">
            ← Voltar às carteiras
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">{portfolio.portfolio.name}</h1>
          {portfolio.portfolio.description && (
            <p className="text-slate-600 mt-2">{portfolio.portfolio.description}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600">Valor Investido</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              R$ {summary.totalInvested.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600">Valor Atual</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              R$ {summary.totalCurrent.toFixed(2)}
            </p>
          </div>
          <div
            className={`bg-white rounded-lg shadow p-6 ${
              summary.totalGain >= 0 ? 'border-green-500' : 'border-red-500'
            } border-t-4`}
          >
            <p className="text-sm text-slate-600">Ganho/Perda</p>
            <p
              className={`text-3xl font-bold mt-2 ${
                summary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              R$ {summary.totalGain.toFixed(2)}
            </p>
          </div>
          <div
            className={`bg-white rounded-lg shadow p-6 ${
              summary.totalGainPercent >= 0 ? 'border-green-500' : 'border-red-500'
            } border-t-4`}
          >
            <p className="text-sm text-slate-600">Rentabilidade</p>
            <p
              className={`text-3xl font-bold mt-2 ${
                summary.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary.totalGainPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Add Asset Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Adicionar Ativo</h2>
            <form onSubmit={handleSubmit(onAddAsset)} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ticker</label>
                <input
                  type="text"
                  {...register('ticker')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: PETR4"
                />
                {errors.ticker && <p className="text-red-600 text-sm mt-1">{errors.ticker.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('quantity')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preço Médio</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('averagePrice')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.averagePrice && (
                    <p className="text-red-600 text-sm mt-1">{errors.averagePrice.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria (Opcional)</label>
                <input
                  type="text"
                  {...register('category')}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: acao"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {adding ? 'Adicionando...' : 'Adicionar Ativo'}
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
          <div className="mb-8 flex gap-3 flex-wrap">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + Adicionar Ativo
            </button>
            <button
              onClick={openImportModal}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              🔄 Sincronizar Investidor10
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              🤖 Análise com IA
            </button>
          </div>
        )}

        {/* Assets Table */}
        {assets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-slate-600 mb-4">Sua carteira está vazia.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Adicionar Primeiro Ativo
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Ticker</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Qtd</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Preço Médio</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Preço Atual</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Total Inv.</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Total Atual</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Ganho/Perda</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assets.map((asset: any) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-900">{asset.ticker}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{asset.quantity.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">R$ {asset.average_price.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">R$ {asset.current_price.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">R$ {asset.invested_value.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">R$ {asset.total_value.toFixed(2)}</td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        asset.gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {asset.gain >= 0 ? '+' : ''}R$ {asset.gain.toFixed(2)}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        asset.gain_percent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {asset.gain_percent >= 0 ? '+' : ''}
                      {asset.gain_percent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && portfolioId && (
          <PortfolioImportModal
            portfolioId={portfolioId}
            dataSourceId={dataSourceId}
            onImportComplete={handleImportComplete}
            onClose={() => setShowImportModal(false)}
          />
        )}

        {/* AI Analysis Modal */}
        {showAIModal && portfolioId && (
          <AIAnalysisModal
            portfolioId={portfolioId}
            onAnalysisComplete={() => {
              // Optionally reload portfolio
            }}
            onClose={() => setShowAIModal(false)}
          />
        )}
      </div>
    </div>
  )
}
