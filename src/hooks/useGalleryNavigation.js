import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

export function useGalleryNavigation(items) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef(null)

  const totalItems = useMemo(() => items?.length || 0, [items])

  const goToNext = useCallback(() => {
    if (isAnimating || totalItems <= 1) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % totalItems)
    setTimeout(() => setIsAnimating(false), 1200)
  }, [isAnimating, totalItems])

  const goToPrev = useCallback(() => {
    if (isAnimating || totalItems <= 1) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems)
    setTimeout(() => setIsAnimating(false), 1200)
  }, [isAnimating, totalItems])

  const goToIndex = useCallback((index) => {
    if (isAnimating || index === currentIndex || totalItems <= 1) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 1200)
  }, [isAnimating, currentIndex, totalItems])

  useEffect(() => {
    if (totalItems <= 1) return
    intervalRef.current = setInterval(goToNext, 7000)
    return () => clearInterval(intervalRef.current)
  }, [totalItems, goToNext])

  return {
    currentIndex,
    totalItems,
    isAnimating,
    goToNext,
    goToPrev,
    goToIndex,
    currentItem: items?.[currentIndex],
  }
}