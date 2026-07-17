import { useEffect, useRef, useCallback, useState } from 'react'

export function useGalleryNavigation({
  isOpen,
  onClose,
  onPrev,
  onNext,
  totalItems,
  currentIndex,
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

export function useZoom() {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const imageRef = useRef(null)

  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        setScale((prev) => {
          const newScale = Math.min(Math.max(prev - e.deltaY * 0.001, 1), 4)
          return newScale
        })
      }
    },
    []
  )

  const handleMouseDown = useCallback(
    (e) => {
      if (scale <= 1) return
      isDragging.current = true
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
      e.target.style.cursor = 'grabbing'
    },
    [scale, position]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging.current || scale <= 1) return
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    },
    [scale]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (imageRef.current) {
      imageRef.current.style.cursor = 'grab'
    }
  }, [])

  const handleDoubleClick = useCallback(() => {
    setScale((prev) => (prev > 1 ? 1 : 2))
  }, [])

  return {
    scale,
    position,
    resetZoom,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    imageRef,
  }
}