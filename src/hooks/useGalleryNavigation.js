import { useEffect, useRef, useCallback } from 'react'

export function useGalleryNavigation({
  isOpen,
  onClose,
  onPrev,
  onNext,
}) {
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          onNext()
          break
      }
    },
    [isOpen, onClose, onPrev, onNext]
  )

  const handleTouchStart = useCallback(
    (e) => {
      if (!isOpen) return
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    },
    [isOpen]
  )

  const handleTouchEnd = useCallback(
    (e) => {
      if (!isOpen || touchStartX.current === null) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const diffX = touchStartX.current - touchEndX
      const diffY = touchStartY.current - touchEndY

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          onNext()
        } else {
          onPrev()
        }
      }

      touchStartX.current = null
      touchStartY.current = null
    },
    [isOpen, onPrev, onNext]
  )

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return { handleTouchStart, handleTouchEnd }
}