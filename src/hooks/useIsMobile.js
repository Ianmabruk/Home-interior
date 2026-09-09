import { useEffect, useState } from 'react'

function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    const debouncedCheck = debounce(checkMobile, 150)
    window.addEventListener('resize', debouncedCheck)
    return () => window.removeEventListener('resize', debouncedCheck)
  }, [breakpoint])

  return isMobile
}