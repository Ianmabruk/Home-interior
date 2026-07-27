import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

const AuthLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
  </div>
)

export const AuthShell = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={<AuthLoader />}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </div>
      </main>
    </div>
  )
}

export default AuthShell