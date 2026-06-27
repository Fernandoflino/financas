import { useState, useCallback } from 'react'
import { MarketDataService } from '@/lib/services/MarketDataService'
import type { BrapiQuote } from '@/lib/providers/BRAPIProvider'

interface UseMarketDataState {
  quote: BrapiQuote | null
  quotes: BrapiQuote[]
  loading: boolean
  error: string | null
}

interface UseMarketDataReturn extends UseMarketDataState {
  fetchQuote: (ticker: string, forceRefresh?: boolean) => Promise<void>
  fetchQuotes: (tickers: string[], forceRefresh?: boolean) => Promise<void>
  clearError: () => void
}

/**
 * Hook to fetch and cache market data
 *
 * Usage:
 * const { quote, loading, error, fetchQuote } = useMarketData()
 * await fetchQuote('PETR4')
 */
export function useMarketData(): UseMarketDataReturn {
  const [state, setState] = useState<UseMarketDataState>({
    quote: null,
    quotes: [],
    loading: false,
    error: null,
  })

  const fetchQuote = useCallback(async (ticker: string, forceRefresh = false) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const quote = await MarketDataService.getQuote(ticker, forceRefresh)
      setState((prev) => ({
        ...prev,
        quote,
        loading: false,
        error: quote ? null : `Failed to fetch quote for ${ticker}`,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  const fetchQuotes = useCallback(async (tickers: string[], forceRefresh = false) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const quotes = await MarketDataService.getQuotes(tickers, forceRefresh)
      setState((prev) => ({
        ...prev,
        quotes,
        loading: false,
        error: quotes.length === 0 ? 'No quotes fetched' : null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    fetchQuote,
    fetchQuotes,
    clearError,
  }
}
