import { useState } from 'react'
import { Investidor10TextProvider, type Investidor10Asset } from '@/lib/providers/Investidor10TextProvider'
import { supabase } from '@/lib/supabase'

interface PortfolioImportModalProps {
  portfolioId: string
  dataSourceId: string
  onImportComplete: (result: any) => void
  onClose: () => void
}

export function PortfolioImportModal({
  portfolioId,
  dataSourceId,
  onImportComplete,
  onClose,
}: PortfolioImportModalProps) {
  const [textInput, setTextInput] = useState('')
  const [parsedAssets, setParsedAssets] = useState<Investidor10Asset[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleParse = () => {
    setError('')
    try {
      const assets = Investidor10TextProvider.parse(textInput)
      if (assets.length === 0) {
        setError('Nenhum ativo encontrado. Verifique o formato do texto colado.')
        return
      }
      setParsedAssets(assets)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar texto')
    }
  }

  const handleConfirmImport = async () => {
    if (parsedAssets.length === 0) return

    try {
      setLoading(true)
      setError('')

      // @ts-expect-error - custom RPC
      const { data, error: rpcError } = await supabase.rpc('apply_portfolio_import', {
        p_portfolio_id: portfolioId,
        p_data_source_id: dataSourceId,
        p_items: parsedAssets,
      })

      if (rpcError) throw rpcError

      onImportComplete(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900">Sincronizar Carteira</h2>
          <p className="text-slate-600 mt-1">Cole o texto da sua carteira do Investidor10</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
              {error}
            </div>
          )}

          {!showPreview ? (
            <>
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cole o texto da sua carteira (Ctrl+A / Ctrl+C da página pública do Investidor10)
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={8}
                  placeholder="Ticker Qtd Preço Médio Preço Atual..."
                />
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Como usar:</strong> Abra a página da sua carteira no Investidor10, selecione todo o
                  conteúdo (Ctrl+A), copie (Ctrl+C) e cole aqui.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Ativos encontrados: {parsedAssets.length}
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Ticker</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-900">Qtd</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-900">Preço Médio</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-900">Preço Atual</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Categoria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parsedAssets.map((asset, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{asset.ticker}</td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {asset.quantity.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            R$ {asset.averagePrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            R$ {asset.currentPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{asset.category || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  ⚠️ Esta ação <strong>substituirá todos os ativos</strong> da carteira. Ativos não encontrados
                  serão removidos.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
          {showPreview ? (
            <>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setParsedAssets([])
                }}
                className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleParse}
                disabled={textInput.trim().length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                Pré-visualizar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
