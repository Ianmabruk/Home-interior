import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CurrencyContext = createContext(null)

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('hok_currency')
    return saved || 'USD'
  })

  useEffect(() => {
    localStorage.setItem('hok_currency', currency)
  }, [currency])

  const formatPrice = useCallback((amount, currencyCode = currency) => {
    const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0]
    return `${curr.symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [currency])

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatPrice,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    }),
    [currency, formatPrice],
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