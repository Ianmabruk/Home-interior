/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, memo } from 'react'
import { CURRENCIES, EXCHANGE_RATES } from '../utils/constants'

const CurrencyContext = createContext(null)

export const CurrencyProvider = memo(({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('hok_currency')
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      return saved
    }
    return 'USD'
  })

  useEffect(() => {
    localStorage.setItem('hok_currency', currency)
  }, [currency])

  const changeCurrency = useCallback((newCurrency) => {
    setCurrency(newCurrency)
  }, [])

  const formatPrice = useCallback((amount) => {
    const rate = EXCHANGE_RATES[currency] || 1
    const converted = Math.round(amount * rate)
    const currencyObj = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

    if (currency === 'KES') {
      return `${currencyObj.symbol} ${converted.toLocaleString()}`
    }
    return `${currencyObj.symbol}${converted.toLocaleString()}`
  }, [currency])

  const value = useMemo(
    () => ({
      currency,
      currencies: CURRENCIES,
      changeCurrency,
      formatPrice,
    }),
    [currency, changeCurrency, formatPrice],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
})

CurrencyProvider.displayName = 'CurrencyProvider'

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}
