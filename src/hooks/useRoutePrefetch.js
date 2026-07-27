import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export function useRoutePrefetch() {
  const navigate = useNavigate()
  const timeoutRef = useRef(null)
  const prefetchedRef = useRef(new Set())

  const prefetchRoute = useCallback((importFn) => {
    const cacheKey = importFn.toString()
    if (prefetchedRef.current.has(cacheKey)) return
    prefetchedRef.current.add(cacheKey)
    importFn().catch(() => {
      prefetchedRef.current.delete(cacheKey)
    })
  }, [])

  const handleMouseEnter = useCallback(
    (routePath, importFn) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        prefetchRoute(importFn)
      }, 50)
    },
    [prefetchRoute],
  )

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const handleClick = useCallback(
    (routePath) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      navigate(routePath)
    },
    [navigate],
  )

  return {
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    prefetchRoute,
  }
}

export function usePrefetchOnIdle() {
  const prefetchedRef = useRef(new Set())

  const prefetch = useCallback((importFn) => {
    const cacheKey = importFn.toString()
    if (prefetchedRef.current.has(cacheKey)) return
    prefetchedRef.current.add(cacheKey)

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(() => {
          prefetchedRef.current.delete(cacheKey)
        })
      }, { timeout: 2000 })
    } else {
      setTimeout(() => {
        importFn().catch(() => {
          prefetchedRef.current.delete(cacheKey)
        })
      }, 1500)
    }
  }, [])

  return { prefetch }
}