import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '../Footer'
import { Navbar } from '../Navbar'
import { ErrorBoundary } from '../common/ErrorBoundary'

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-borderSubtle border-t-accent" />
  </div>
)

export const Layout = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-cream text-espresso flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}
