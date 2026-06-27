import { supabase } from '@/lib/supabase'
import { PortfolioService } from '@/lib/services/PortfolioService'

export interface AIAnalysisRequest {
  portfolioId: string
  promptType: 'portfolio_analysis' | 'asset_recommendation' | 'risk_assessment'
  customPrompt?: string
}

export interface AIAnalysisResult {
  id: string
  analysis: string
  model: string
  tokensUsed?: number
  costUsd?: number
  createdAt: string
}

export class AIService {
  static async requestAnalysis(req: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      const portfolio = await PortfolioService.getPortfolioWithDetails(req.portfolioId)
      if (!portfolio) {
        throw new Error('Portfolio not found')
      }

      // Build prompt based on type
      const prompt = this.buildPrompt(req.promptType, portfolio, req.customPrompt)

      // Call Edge Function (it has the OpenRouter API key)
      const { data, error } = await supabase.functions.invoke('analyze-portfolio', {
        body: {
          portfolioId: req.portfolioId,
          promptType: req.promptType,
          prompt,
        },
      })

      if (error) throw error

      return {
        id: data.analysisId,
        analysis: data.analysis,
        model: data.model,
        tokensUsed: data.tokensUsed,
        costUsd: data.costUsd,
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error in AI analysis')
    }
  }

  static async getAnalysisHistory(portfolioId: string): Promise<AIAnalysisResult[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ai_analyses')
        .select('id, response_text, model, tokens_used, cost_usd, created_at')
        .eq('portfolio_id', portfolioId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.id,
        analysis: item.response_text,
        model: item.model,
        tokensUsed: item.tokens_used,
        costUsd: item.cost_usd,
        createdAt: item.created_at,
      }))
    } catch (error) {
      console.error('Error fetching analysis history:', error)
      return []
    }
  }

  private static buildPrompt(
    promptType: string,
    portfolio: any,
    customPrompt?: string
  ): string {
    const { summary, assets } = portfolio
    const portfolioSummary = `
Carteira: ${portfolio.portfolio.name}
Patrimônio investido: R$ ${summary.totalInvested.toFixed(2)}
Valor atual: R$ ${summary.totalCurrent.toFixed(2)}
Ganho/Perda: R$ ${summary.totalGain.toFixed(2)} (${summary.totalGainPercent.toFixed(2)}%)

Ativos:
${assets.map((a: any) => `- ${a.ticker}: ${a.quantity} unidades @ R$ ${a.average_price.toFixed(2)} (atual: R$ ${a.current_price.toFixed(2)}, ganho: ${a.gain_percent.toFixed(2)}%)`).join('\n')}
    `.trim()

    switch (promptType) {
      case 'portfolio_analysis':
        return `Analise esta carteira de investimentos e forneça insights sobre diversificação, performance e riscos:\n\n${portfolioSummary}`

      case 'asset_recommendation':
        return `Baseado nesta carteira, quais seriam seus top 3 ativos para melhorar a diversificação e reduzir riscos?\n\n${portfolioSummary}`

      case 'risk_assessment':
        return `Avalie o risco desta carteira considerando concentração, diversificação de setores e volatilidade:\n\n${portfolioSummary}`

      default:
        return customPrompt || `Analise esta carteira:\n\n${portfolioSummary}`
    }
  }
}
