import { useCallback, useRef } from 'react'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function useRateLimit(config: RateLimitConfig) {
  const requestTimestamps = useRef<number[]>([])

  const isLimited = useCallback((): boolean => {
    const now = Date.now()
    const recentRequests = requestTimestamps.current.filter(
      timestamp => now - timestamp < config.windowMs
    )

    return recentRequests.length >= config.maxRequests
  }, [config])

  const recordRequest = useCallback((): void => {
    requestTimestamps.current.push(Date.now())

    // Clean up old timestamps
    const cutoff = Date.now() - config.windowMs
    requestTimestamps.current = requestTimestamps.current.filter(ts => ts > cutoff)
  }, [config])

  const getRemainingRequests = useCallback((): number => {
    const now = Date.now()
    const recentRequests = requestTimestamps.current.filter(
      timestamp => now - timestamp < config.windowMs
    )
    return Math.max(0, config.maxRequests - recentRequests.length)
  }, [config])

  return {
    isLimited,
    recordRequest,
    getRemainingRequests,
  }
}
