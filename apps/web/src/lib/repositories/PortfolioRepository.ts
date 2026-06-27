import { supabase } from '@/lib/supabase'

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description?: string
  currency: string
  created_at: string
  updated_at: string
}

export interface DataSource {
  id: string
  portfolio_id: string
  user_id: string
  provider: string
  name: string
  url?: string
  active: boolean
  principal: boolean
  created_at: string
  updated_at: string
  last_sync?: string
  last_status?: string
  last_error?: string
}

export interface PortfolioAsset {
  id: string
  portfolio_id: string
  data_source_id: string
  user_id: string
  ticker: string
  quantity: number
  average_price: number
  current_price?: number
  category?: string
  sector?: string
  created_at: string
  updated_at: string
}

export class PortfolioRepository {
  /**
   * Get all portfolios for current user
   */
  static async getUserPortfolios(): Promise<Portfolio[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching portfolios:', err)
      return []
    }
  }

  /**
   * Get portfolio by ID
   */
  static async getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error(`Error fetching portfolio ${portfolioId}:`, err)
      return null
    }
  }

  /**
   * Create new portfolio
   */
  static async createPortfolio(name: string, description?: string): Promise<any> {
    try {
      // @ts-expect-error - custom RPC
      const { data, error } = await supabase.rpc('create_portfolio', {
        p_name: name,
        p_description: description,
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating portfolio:', err)
      return null
    }
  }

  /**
   * Update portfolio
   */
  static async updatePortfolio(
    portfolioId: string,
    updates: Partial<Portfolio>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('portfolios')
        .update(updates)
        .eq('id', portfolioId)

      if (error) throw error
      return true
    } catch (err) {
      console.error(`Error updating portfolio ${portfolioId}:`, err)
      return false
    }
  }

  /**
   * Delete portfolio
   */
  static async deletePortfolio(portfolioId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any).from('portfolios').delete().eq('id', portfolioId)

      if (error) throw error
      return true
    } catch (err) {
      console.error(`Error deleting portfolio ${portfolioId}:`, err)
      return false
    }
  }

  /**
   * Get data sources for portfolio
   */
  static async getDataSources(portfolioId: string): Promise<DataSource[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('data_sources')
        .select('*')
        .eq('portfolio_id', portfolioId)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error(`Error fetching data sources:`, err)
      return []
    }
  }

  /**
   * Get assets for portfolio
   */
  static async getPortfolioAssets(portfolioId: string): Promise<PortfolioAsset[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('portfolio_assets')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error(`Error fetching portfolio assets:`, err)
      return []
    }
  }

  /**
   * Add asset to portfolio
   */
  static async addAsset(
    portfolioId: string,
    ticker: string,
    quantity: number,
    averagePrice: number,
    category?: string,
    sector?: string
  ): Promise<any> {
    try {
      // @ts-expect-error - custom RPC
      const { data, error } = await supabase.rpc('add_portfolio_asset', {
        p_portfolio_id: portfolioId,
        p_ticker: ticker,
        p_quantity: quantity,
        p_average_price: averagePrice,
        p_category: category,
        p_sector: sector,
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error(`Error adding asset:`, err)
      return null
    }
  }

  /**
   * Update asset
   */
  static async updateAsset(
    assetId: string,
    updates: Partial<PortfolioAsset>
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any).from('portfolio_assets').update(updates).eq('id', assetId)

      if (error) throw error
      return true
    } catch (err) {
      console.error(`Error updating asset ${assetId}:`, err)
      return false
    }
  }

  /**
   * Delete asset
   */
  static async deleteAsset(assetId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any).from('portfolio_assets').delete().eq('id', assetId)

      if (error) throw error
      return true
    } catch (err) {
      console.error(`Error deleting asset ${assetId}:`, err)
      return false
    }
  }
}
