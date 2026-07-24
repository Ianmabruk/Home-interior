/* eslint-disable react-refresh/only-export-components -- Utility file with hook + component */
import { useEffect, useRef, useState } from 'react'

export const useScrollReveal = (options = {}) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const stableOptions = useRef(options)

  useEffect(() => {
    stableOptions.current = options
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const { threshold, rootMargin, once } = stableOptions.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once !== false) {
            observer.unobserve(element)
          } else {
            setIsVisible(false)
          }
        } else if (once === false) {
          setIsVisible(false)
        }
      },
      { threshold: threshold || 0.1, rootMargin: rootMargin || '0px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

export const ScrollReveal = ({ children, once = true, threshold = 0.1, rootMargin = '0px', className = '', delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal({ once, threshold, rootMargin })

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  )
}
