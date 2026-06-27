import { z } from 'zod'

// BRAPI Quote Response Schema
const BrapiQuoteSchema = z.object({
  symbol: z.string(),
  shortName: z.string().optional(),
  longName: z.string().optional(),
  lastPrice: z.number(),
  priceChange: z.number(),
  priceChangePercent: z.number(),
  currency: z.string().default('BRL'),
  marketCap: z.number().optional(),
  logourl: z.string().optional(),
  sector: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
})

export type BrapiQuote = z.infer<typeof BrapiQuoteSchema>

export class BRAPIProvider {
  private baseUrl = 'https://brapi.dev/api'
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ''
  }

  /**
   * Fetch quote data for a single ticker
   */
  async getQuote(ticker: string): Promise<BrapiQuote | null> {
    try {
      const url = new URL(`${this.baseUrl}/quote/${ticker}`)
      if (this.apiKey) {
        url.searchParams.append('token', this.apiKey)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.error(`BRAPI error: ${response.statusText}`)
        return null
      }

      const data = await response.json()

      // BRAPI returns { results: [...] }
      if (!data.results || data.results.length === 0) {
        return null
      }

      const result = BrapiQuoteSchema.parse(data.results[0])
      return result
    } catch (error) {
      console.error('Error fetching quote from BRAPI:', error)
      return null
    }
  }

  /**
   * Fetch quotes for multiple tickers
   */
  async getQuotes(tickers: string[]): Promise<BrapiQuote[]> {
    try {
      const tickerString = tickers.join(',')
      const url = new URL(`${this.baseUrl}/quote/${tickerString}`)
      if (this.apiKey) {
        url.searchParams.append('token', this.apiKey)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.error(`BRAPI error: ${response.statusText}`)
        return []
      }

      const data = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        return []
      }

      return data.results.map((item: any) => BrapiQuoteSchema.parse(item))
    } catch (error) {
      console.error('Error fetching quotes from BRAPI:', error)
      return []
    }
  }

  /**
   * Fetch historical data for a ticker
   */
  async getHistorical(ticker: string, range: string = '1y'): Promise<any[] | null> {
    try {
      const url = new URL(`${this.baseUrl}/quote/${ticker}/history`)
      url.searchParams.append('range', range)
      if (this.apiKey) {
        url.searchParams.append('token', this.apiKey)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.error(`BRAPI error: ${response.statusText}`)
        return null
      }

      const data = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        return null
      }

      return data.results
    } catch (error) {
      console.error('Error fetching historical data from BRAPI:', error)
      return null
    }
  }
}

// Singleton instance
let brapi: BRAPIProvider | null = null

export function getBRAPIProvider(apiKey?: string): BRAPIProvider {
  if (!brapi) {
    brapi = new BRAPIProvider(apiKey)
  }
  return brapi
}
