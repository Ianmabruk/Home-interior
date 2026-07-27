import { useState, useRef, useCallback } from 'react'

export function useZoom(options = {}) {
  const { minScale = 1, maxScale = 4, initialScale = 1 } = options

  const [scale, setScale] = useState(initialScale)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const imageRef = useRef(null)

  const resetZoom = useCallback(() => {
    setScale(initialScale)
    setPosition({ x: 0, y: 0 })
  }, [initialScale])

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setScale((prev) => {
        const newScale = Math.min(Math.max(prev - e.deltaY * 0.001, minScale), maxScale)
        return newScale
      })
    }
  }, [minScale, maxScale])

  const handleMouseDown = useCallback((e) => {
    if (scale <= minScale) return
    isDragging.current = true
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    if (imageRef.current) imageRef.current.style.cursor = 'grabbing'
  }, [scale, position, minScale])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || scale <= minScale) return
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }, [scale, minScale])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (imageRef.current) {
      imageRef.current.style.cursor = 'grab'
    }
  }, [])

  const handleDoubleClick = useCallback(() => {
    setScale((prev) => (prev > minScale ? minScale : maxScale))
  }, [minScale, maxScale])

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

export default useZoom
