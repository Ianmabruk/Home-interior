import { createContext, useContext, useCallback, useMemo } from 'react'

const CurrencyContext = createContext(null)

// Kenyan Shilling is the only supported currency
const CURRENCY = { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' }

export function CurrencyProvider({ children }) {
  const formatPrice = useCallback((amount) => {
    return `${CURRENCY.symbol} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  const value = useMemo(
    () => ({
      currency: CURRENCY.code,
      formatPrice,
    }),
    [formatPrice],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}