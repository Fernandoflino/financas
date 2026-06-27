import {
  PortfolioRepository,
  type Portfolio,
} from '@/lib/repositories/PortfolioRepository'
import { MarketDataService } from '@/lib/services/MarketDataService'

export class PortfolioService {
  static async getUserPortfolios(): Promise<Portfolio[]> {
    return PortfolioRepository.getUserPortfolios()
  }

  static async getPortfolioWithDetails(portfolioId: string): Promise<any> {
    try {
      const portfolio = await PortfolioRepository.getPortfolio(portfolioId)
      if (!portfolio) return null

      const assets = await PortfolioRepository.getPortfolioAssets(portfolioId)
      const dataSources = await PortfolioRepository.getDataSources(portfolioId)

      // Get current prices for all tickers
      const tickers = assets.map((a) => a.ticker)
      const quotes = tickers.length > 0 ? await MarketDataService.getQuotes(tickers) : []

      // Enrich assets with current prices and calculations
      const enrichedAssets = assets.map((asset) => {
        const quote = quotes.find((q) => q.symbol === asset.ticker)
        const currentPrice = quote?.lastPrice || asset.current_price || 0
        const totalValue = asset.quantity * currentPrice
        const investedValue = asset.quantity * asset.average_price
        const gain = totalValue - investedValue
        const gainPercent = investedValue > 0 ? (gain / investedValue) * 100 : 0

        return {
          ...asset,
          current_price: currentPrice,
          total_value: totalValue,
          invested_value: investedValue,
          gain,
          gain_percent: gainPercent,
          last_price_change: quote?.priceChange || 0,
          last_price_change_percent: quote?.priceChangePercent || 0,
        }
      })

      // Calculate portfolio totals
      const totalInvested = enrichedAssets.reduce((sum, a) => sum + a.invested_value, 0)
      const totalCurrent = enrichedAssets.reduce((sum, a) => sum + a.total_value, 0)
      const totalGain = totalCurrent - totalInvested
      const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

      return {
        portfolio,
        assets: enrichedAssets,
        dataSources,
        summary: {
          totalInvested,
          totalCurrent,
          totalGain,
          totalGainPercent,
          assetCount: assets.length,
        },
      }
    } catch (error) {
      console.error(`Error getting portfolio details:`, error)
      return null
    }
  }

  static async createPortfolio(name: string, description?: string): Promise<any> {
    return PortfolioRepository.createPortfolio(name, description)
  }

  static async updatePortfolio(
    portfolioId: string,
    updates: Partial<Portfolio>
  ): Promise<boolean> {
    return PortfolioRepository.updatePortfolio(portfolioId, updates)
  }

  static async deletePortfolio(portfolioId: string): Promise<boolean> {
    return PortfolioRepository.deletePortfolio(portfolioId)
  }

  static async addAsset(
    portfolioId: string,
    ticker: string,
    quantity: number,
    averagePrice: number,
    category?: string
  ): Promise<any> {
    const quote = await MarketDataService.getQuote(ticker)
    if (!quote) {
      throw new Error(`Ticker ${ticker} not found in market`)
    }

    return PortfolioRepository.addAsset(
      portfolioId,
      ticker,
      quantity,
      averagePrice,
      category,
      quote.sector
    )
  }

  static async updateAsset(
    assetId: string,
    quantity: number,
    averagePrice: number
  ): Promise<boolean> {
    return PortfolioRepository.updateAsset(assetId, {
      quantity,
      average_price: averagePrice,
      updated_at: new Date().toISOString(),
    })
  }

  static async deleteAsset(assetId: string): Promise<boolean> {
    return PortfolioRepository.deleteAsset(assetId)
  }

  static calculateMetrics(assets: any[]): any {
    if (assets.length === 0) {
      return {
        totalInvested: 0,
        totalCurrent: 0,
        totalGain: 0,
        gainPercent: 0,
      }
    }

    const totalInvested = assets.reduce((sum, a) => sum + a.invested_value, 0)
    const totalCurrent = assets.reduce((sum, a) => sum + a.total_value, 0)
    const totalGain = totalCurrent - totalInvested
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

    return {
      totalInvested,
      totalCurrent,
      totalGain,
      gainPercent,
    }
  }
}
