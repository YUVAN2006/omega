import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { LoginScreen } from '@/components/layout/LoginScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { useOmegaStore } from '@/store'

export default function App() {
  const { isAuthenticated, checkAuth } = useAuth()
  const { setAuth } = useOmegaStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(17,24,39,0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(0,245,255,0.15)',
            backdropFilter: 'blur(20px)',
            fontFamily: '"Exo 2", sans-serif',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#1db954', secondary: '#000' },
          },
          error: {
            iconTheme: { primary: '#ff0090', secondary: '#fff' },
          },
        }}
      />

      <AnimatePresence mode="wait">
        {isAuthenticated ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Dashboard />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoginScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
