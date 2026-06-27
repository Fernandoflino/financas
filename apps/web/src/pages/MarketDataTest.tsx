import { useState } from 'react'
import { useMarketData } from '@/hooks/useMarketData'

export default function MarketDataTestPage() {
  const { quote, quotes, loading, error, fetchQuote, fetchQuotes, clearError } = useMarketData()
  const [singleTicker, setSingleTicker] = useState('PETR4')
  const [multipleTickers, setMultipleTickers] = useState('PETR4,VALE3,BBAS3')

  const handleSingleTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchQuote(singleTicker)
  }

  const handleMultipleTickersSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tickers = multipleTickers.split(',').map((t) => t.trim())
    fetchQuotes(tickers)
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Teste — MarketData Module</h1>
        <p className="text-slate-600 mb-8">
          Teste busca de cotações com cache automático via BRAPI
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-start">
              <p className="text-red-900">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Single Ticker */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Buscar Single Ticker</h2>
          <form onSubmit={handleSingleTickerSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={singleTicker}
              onChange={(e) => setSingleTicker(e.target.value.toUpperCase())}
              placeholder="Ex: PETR4"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              type="button"
              onClick={() => fetchQuote(singleTicker, true)}
              disabled={loading}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition text-sm"
              title="Forçar busca da API mesmo se em cache"
            >
              Atualizar
            </button>
          </form>

          {quote && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Ticker</p>
                  <p className="text-2xl font-bold text-slate-900">{quote.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Preço</p>
                  <p className="text-2xl font-bold text-slate-900">R$ {quote.lastPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Variação</p>
                  <p
                    className={`text-2xl font-bold ${
                      quote.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {quote.priceChange >= 0 ? '+' : ''}
                    {quote.priceChange.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Variação %</p>
                  <p
                    className={`text-2xl font-bold ${
                      quote.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {quote.priceChangePercent >= 0 ? '+' : ''}
                    {quote.priceChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              {quote.longName && <p className="mt-4 text-sm text-slate-600">{quote.longName}</p>}
            </div>
          )}
        </div>

        {/* Multiple Tickers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Buscar Múltiplos Tickers</h2>
          <form onSubmit={handleMultipleTickersSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={multipleTickers}
              onChange={(e) => setMultipleTickers(e.target.value.toUpperCase())}
              placeholder="Ex: PETR4,VALE3,BBAS3"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {quotes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-900">Ticker</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-900">Preço</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-900">Variação</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-900">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quotes.map((q) => (
                    <tr key={q.symbol} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{q.symbol}</td>
                      <td className="px-4 py-2 text-right text-slate-600">R$ {q.lastPrice.toFixed(2)}</td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          q.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {q.priceChange >= 0 ? '+' : ''}
                        {q.priceChange.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          q.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {q.priceChangePercent >= 0 ? '+' : ''}
                        {q.priceChangePercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Como funciona o Cache:</h3>
          <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
            <li>Primeira busca: vai para BRAPI, dados são cacheados por 1 hora</li>
            <li>Buscas subsequentes (dentro de 1h): retorna do cache instantaneamente</li>
            <li>Clique em "Atualizar" para forçar busca da API mesmo se em cache</li>
            <li>Cache expire automaticamente após 1 hora</li>
            <li>Log no console mostra [Cache HIT/MISS]</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
