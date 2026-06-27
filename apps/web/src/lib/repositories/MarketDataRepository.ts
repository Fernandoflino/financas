import { supabase } from '@/lib/supabase'
import type { BrapiQuote } from '@/lib/providers/BRAPIProvider'

export interface CachedMarketData {
  id: string
  provider_code: string
  data_type: string
  ticker: string
  payload: any
  fetched_at: string
  expires_at: string
}

export class MarketDataRepository {
  /**
   * Get cached market data if not expired
   */
  static async getFromCache(
    provider: string,
    dataType: string,
    ticker: string
  ): Promise<any | null> {
    try {
      // @ts-expect-error - market_data schema not in public types
      const { data, error } = await supabase.rpc('get_or_fetch', {
        p_provider_code: provider,
        p_data_type: dataType,
        p_ticker: ticker,
        p_ttl_seconds: 3600, // 1 hour default
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error getting from cache:', err)
      return null
    }
  }

  /**
   * Cache market data
   */
  static async setCache(
    provider: string,
    dataType: string,
    ticker: string,
    payload: any,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    try {
      // @ts-expect-error - market_data schema not in public types
      const { error } = await supabase.rpc('set_cache', {
        p_provider_code: provider,
        p_data_type: dataType,
        p_ticker: ticker,
        p_payload: payload,
        p_ttl_seconds: ttlSeconds,
      })

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error caching data:', err)
      return false
    }
  }

  /**
   * Get or fetch quote from BRAPI
   * 1. Check cache
   * 2. If expired/missing, fetch from BRAPI (requires service call)
   * 3. Cache result
   * 4. Return
   */
  static async getQuoteWithCache(ticker: string): Promise<BrapiQuote | null> {
    try {
      // Step 1: Check cache
      const cached = await this.getFromCache('brapi', 'quote', ticker)
      if (cached) {
        console.log(`[Cache HIT] ${ticker}`)
        return cached
      }

      console.log(`[Cache MISS] ${ticker} - would fetch from BRAPI`)
      // Step 2: Fetch from BRAPI (this is a placeholder - actual fetch happens via service)
      // Step 3: Cache (done by service)
      // Step 4: Return
      return null
    } catch (err) {
      console.error('Error getting quote:', err)
      return null
    }
  }

  /**
   * Clean expired cache entries
   */
  static async cleanupExpired(): Promise<number> {
    try {
      // @ts-expect-error - market_data schema not in public types
      const { data: result, error } = await supabase.rpc('cleanup_expired')
      if (error) throw error
      console.log(`Cleaned up ${result} expired cache entries`)
      return result || 0
    } catch (err) {
      console.error('Error cleaning up cache:', err)
      return 0
    }
  }
}
