import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardService, type DashboardData } from '@/lib/services/DashboardService'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await DashboardService.getDashboardData()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!data) {
    return <div className="p-8 text-red-600">{error}</div>
  }

  const { metrics, assetAllocations, categoryDistribution, topAssets } = data

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">Visão consolidada do seu patrimônio</p>
          </div>
          <Link
            to="/portfolios"
            className="text-blue-600 hover:underline"
          >
            ← Minhas Carteiras
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600">Patrimônio Total Investido</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              R$ {metrics.totalInvested.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-slate-600">Valor Atual do Patrimônio</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              R$ {metrics.totalCurrent.toFixed(2)}
            </p>
          </div>
          <div
            className={`bg-white rounded-lg shadow p-6 ${
              metrics.totalGain >= 0 ? 'border-green-500' : 'border-red-500'
            } border-t-4`}
          >
            <p className="text-sm text-slate-600">Ganho/Perda Total</p>
            <p
              className={`text-3xl font-bold mt-2 ${
                metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              R$ {metrics.totalGain.toFixed(2)}
            </p>
          </div>
          <div
            className={`bg-white rounded-lg shadow p-6 ${
              metrics.totalGainPercent >= 0 ? 'border-green-500' : 'border-red-500'
            } border-t-4`}
          >
            <p className="text-sm text-slate-600">Rentabilidade Total</p>
            <p
              className={`text-3xl font-bold mt-2 ${
                metrics.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {metrics.totalGainPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-700">Carteiras</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.portfolioCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-700">Ativos Diferentes</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.assetCount}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Asset Distribution */}
          {assetAllocations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição por Ativo (Top 5)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topAssets}
                    dataKey="value"
                    nameKey="ticker"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {topAssets.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Distribution */}
          {categoryDistribution.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição por Categoria</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Assets Table */}
        {topAssets.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Top 5 Maiores Posições</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Ticker</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Quantidade</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Preço Atual</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Valor Total</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">% do Patrimônio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topAssets.map((asset) => (
                  <tr key={asset.ticker} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-900">{asset.ticker}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{asset.quantity.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      R$ {asset.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">
                      R$ {asset.value.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      {asset.percentOfTotal.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {metrics.portfolioCount === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-slate-600 mb-4">Você ainda não tem nenhuma carteira.</p>
            <Link
              to="/portfolios"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block"
            >
              Criar Primeira Carteira
            </Link>
          </div>
        )}

        {/* Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-900">
            <strong>💡 Dica:</strong> Os dados do dashboard são atualizados em tempo real com base nas cotações
            em cache. Para atualizar as cotações, abra uma carteira e sincronize os dados.
          </p>
        </div>
      </div>
    </div>
  )
}
