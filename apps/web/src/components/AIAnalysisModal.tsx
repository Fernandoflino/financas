import { useState } from 'react'
import { AIService, type AIAnalysisRequest } from '@/lib/services/AIService'
import { useAuth } from '@/contexts/AuthContext'

interface AIAnalysisModalProps {
  portfolioId: string
  onAnalysisComplete: (analysis: string) => void
  onClose: () => void
}

type PromptType = 'portfolio_analysis' | 'asset_recommendation' | 'risk_assessment'

const promptTypes: Record<PromptType, string> = {
  portfolio_analysis: 'Análise Completa da Carteira',
  asset_recommendation: 'Recomendação de Ativos',
  risk_assessment: 'Avaliação de Risco',
}

export function AIAnalysisModal({
  portfolioId,
  onAnalysisComplete,
  onClose,
}: AIAnalysisModalProps) {
  const { user } = useAuth()
  const [selectedType, setSelectedType] = useState<PromptType>('portfolio_analysis')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState('')

  const handleSubmit = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError('')

      const request: AIAnalysisRequest = {
        portfolioId,
        promptType: selectedType,
      }

      const result = await AIService.requestAnalysis(request)
      setAnalysis(result.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar análise')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onAnalysisComplete(analysis)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900">🤖 Análise com IA</h2>
          <p className="text-slate-600 mt-1">Obtenha insights inteligentes sobre sua carteira</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
              {error}
            </div>
          )}

          {!analysis ? (
            <>
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tipo de Análise
                </label>
                <div className="space-y-2">
                  {(Object.entries(promptTypes) as [PromptType, string][]).map(([type, label]) => (
                    <label key={type} className="flex items-center p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="promptType"
                        value={type}
                        checked={selectedType === type}
                        onChange={() => setSelectedType(type)}
                        className="mr-3"
                      />
                      <span className="text-slate-900 font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Disclaimer:</strong> As análises geradas pela IA são para fins educacionais
                  apenas e não devem ser consideradas como recomendação de investimento. Sempre consulte um
                  profissional qualificado antes de tomar decisões financeiras.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Analysis Result */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Resultado da Análise</h3>
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{analysis}</p>
                </div>
              </div>

              {/* Disclaimer Again */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Aviso Legal:</strong> Esta análise foi gerada por inteligência artificial e pode conter
                  imprecisões. Não é uma recomendação de investimento profissional.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400"
          >
            {analysis ? 'Fechar' : 'Cancelar'}
          </button>
          {!analysis ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Analisando...' : 'Gerar Análise'}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Salvar e Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
