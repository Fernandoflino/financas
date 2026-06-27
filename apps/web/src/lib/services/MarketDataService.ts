import { BRAPIProvider, type BrapiQuote } from '@/lib/providers/BRAPIProvider'
import { MarketDataRepository } from '@/lib/repositories/MarketDataRepository'

/**
 * Market Data Service - Orchestrates data fetching and caching
 *
 * Flow:
 * 1. Check cache (Repository)
 * 2. If expired/missing, fetch from Provider
 * 3. Cache the result
 * 4. Return to caller
 */
export class MarketDataService {
  private static provider = new BRAPIProvider()

  /**
   * Get quote for a single ticker with cache
   */
  static async getQuote(ticker: string, forceRefresh = false): Promise<BrapiQuote | null> {
    try {
      // Step 1: Check cache (unless force refresh)
      if (!forceRefresh) {
        const cached = await MarketDataRepository.getFromCache('brapi', 'quote', ticker)
        if (cached) {
          console.log(`✓ Cache HIT: ${ticker}`)
          return cached
        }
      }

      console.log(`⟳ Cache MISS or force refresh: ${ticker} - fetching from BRAPI...`)

      // Step 2: Fetch from Provider
      const quote = await this.provider.getQuote(ticker)
      if (!quote) {
        console.warn(`✗ Failed to fetch ${ticker} from BRAPI`)
        return null
      }

      // Step 3: Cache the result (1 hour TTL for quotes)
      await MarketDataRepository.setCache('brapi', 'quote', ticker, quote, 3600)
      console.log(`✓ Cached: ${ticker} for 1 hour`)

      // Step 4: Return
      return quote
    } catch (error) {
      console.error(`Error getting quote for ${ticker}:`, error)
      return null
    }
  }

  /**
   * Get quotes for multiple tickers with cache
   */
  static async getQuotes(tickers: string[], forceRefresh = false): Promise<BrapiQuote[]> {
    try {
      const results: BrapiQuote[] = []
      const tickersToFetch: string[] = []

      // Step 1: Check cache for each ticker
      if (!forceRefresh) {
        for (const ticker of tickers) {
          const cached = await MarketDataRepository.getFromCache('brapi', 'quote', ticker)
          if (cached) {
            console.log(`✓ Cache HIT: ${ticker}`)
            results.push(cached)
          } else {
            tickersToFetch.push(ticker)
          }
        }
      } else {
        tickersToFetch.push(...tickers)
      }

      // Step 2: Fetch missing tickers from Provider
      if (tickersToFetch.length > 0) {
        console.log(`⟳ Fetching ${tickersToFetch.length} tickers from BRAPI: ${tickersToFetch.join(', ')}`)
        const quotes = await this.provider.getQuotes(tickersToFetch)

        // Step 3: Cache results
        for (const quote of quotes) {
          await MarketDataRepository.setCache('brapi', 'quote', quote.symbol, quote, 3600)
        }

        results.push(...quotes)
      }

      console.log(`✓ Total quotes: ${results.length}`)
      return results
    } catch (error) {
      console.error('Error getting quotes:', error)
      return []
    }
  }

  /**
   * Get historical data for a ticker
   */
  static async getHistorical(ticker: string, range: string = '1y'): Promise<any[] | null> {
    try {
      console.log(`⟳ Fetching historical data for ${ticker} (${range})...`)

      const data = await this.provider.getHistorical(ticker, range)
      if (!data) {
        console.warn(`✗ Failed to fetch historical data for ${ticker}`)
        return null
      }

      // Cache for 1 day (historical data changes less frequently)
      await MarketDataRepository.setCache('brapi', 'historical', ticker, data, 86400)
      console.log(`✓ Cached: historical data for ${ticker}`)

      return data
    } catch (error) {
      console.error(`Error getting historical data for ${ticker}:`, error)
      return null
    }
  }

  /**
   * Cleanup expired cache entries
   */
  static async cleanupCache(): Promise<number> {
    return MarketDataRepository.cleanupExpired()
  }
}
