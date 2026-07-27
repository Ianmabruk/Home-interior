import { memo } from 'react'
import { AuthProvider } from '@context/AuthContext'
import { ShopProvider } from '@context/ShopContext'
import { CurrencyProvider } from '@context/CurrencyContext'
import { PageMeta } from '@hooks/usePageMeta'

export const AppProviders = memo(({ children }) => (
  <AuthProvider>
    <ShopProvider>
      <CurrencyProvider>
        <PageMeta />
        {children}
      </CurrencyProvider>
    </ShopProvider>
  </AuthProvider>
))

AppProviders.displayName = 'AppProviders'