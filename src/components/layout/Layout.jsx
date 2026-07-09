import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { MobileNav } from './MobileNav'

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-orange" />
  </div>
)

export const Layout = () => {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Navbar />
      <main className="pt-[88px] md:pt-[108px] pb-[72px] md:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}

