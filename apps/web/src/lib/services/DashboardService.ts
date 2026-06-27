import { PortfolioRepository } from '@/lib/repositories/PortfolioRepository'
import { PortfolioService } from '@/lib/services/PortfolioService'

export interface DashboardMetrics {
  totalInvested: number
  totalCurrent: number
  totalGain: number
  totalGainPercent: number
  portfolioCount: number
  assetCount: number
}

export interface AssetAllocation {
  ticker: string
  quantity: number
  currentPrice: number
  value: number
  percentOfTotal: number
  category?: string
  sector?: string
}

export interface CategoryDistribution {
  category: string
  value: number
  percentOfTotal: number
  assetCount: number
}

export interface DashboardData {
  metrics: DashboardMetrics
  assetAllocations: AssetAllocation[]
  categoryDistribution: CategoryDistribution[]
  topAssets: AssetAllocation[]
}

export class DashboardService {
  static async getDashboardData(): Promise<DashboardData> {
    try {
      const portfolios = await PortfolioRepository.getUserPortfolios()

      if (portfolios.length === 0) {
        return this.getEmptyDashboard()
      }

      const detailedPortfolios = await Promise.all(
        portfolios.map(p => PortfolioService.getPortfolioWithDetails(p.id))
      )

      const validPortfolios = detailedPortfolios.filter(p => p !== null)

      // Aggregate metrics
      let totalInvested = 0
      let totalCurrent = 0
      const assetMap = new Map<string, AssetAllocation>()
      const categoryMap = new Map<string, CategoryDistribution>()

      for (const portfolio of validPortfolios) {
        const { summary, assets } = portfolio
        totalInvested += summary.totalInvested
        totalCurrent += summary.totalCurrent

        // Aggregate assets
        for (const asset of assets) {
          const existing = assetMap.get(asset.ticker)
          if (existing) {
            existing.quantity += asset.quantity
            existing.value += asset.total_value
          } else {
            assetMap.set(asset.ticker, {
              ticker: asset.ticker,
              quantity: asset.quantity,
              currentPrice: asset.current_price,
              value: asset.total_value,
              percentOfTotal: 0,
              category: asset.category,
              sector: asset.sector,
            })
          }

          // Aggregate by category
          const category = asset.category || 'Não categorizado'
          const existingCat = categoryMap.get(category)
          if (existingCat) {
            existingCat.value += asset.total_value
            existingCat.assetCount += 1
          } else {
            categoryMap.set(category, {
              category,
              value: asset.total_value,
              percentOfTotal: 0,
              assetCount: 1,
            })
          }
        }
      }

      // Calculate percentages for assets
      const assetAllocations = Array.from(assetMap.values())
      assetAllocations.forEach(asset => {
        asset.percentOfTotal = totalCurrent > 0 ? (asset.value / totalCurrent) * 100 : 0
      })

      // Calculate percentages for categories
      const categoryDistribution = Array.from(categoryMap.values())
      categoryDistribution.forEach(cat => {
        cat.percentOfTotal = totalCurrent > 0 ? (cat.value / totalCurrent) * 100 : 0
      })

      // Sort and get top assets
      const topAssets = assetAllocations.sort((a, b) => b.value - a.value).slice(0, 5)

      const totalGain = totalCurrent - totalInvested
      const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

      return {
        metrics: {
          totalInvested,
          totalCurrent,
          totalGain,
          totalGainPercent,
          portfolioCount: validPortfolios.length,
          assetCount: assetMap.size,
        },
        assetAllocations: assetAllocations.sort((a, b) => b.value - a.value),
        categoryDistribution: categoryDistribution.sort((a, b) => b.value - a.value),
        topAssets,
      }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return this.getEmptyDashboard()
    }
  }

  private static getEmptyDashboard(): DashboardData {
    return {
      metrics: {
        totalInvested: 0,
        totalCurrent: 0,
        totalGain: 0,
        totalGainPercent: 0,
        portfolioCount: 0,
        assetCount: 0,
      },
      assetAllocations: [],
      categoryDistribution: [],
      topAssets: [],
    }
  }
}
