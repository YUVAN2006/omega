import { motion } from 'framer-motion'
import { Wifi, WifiOff, Radio, User, LogOut, Zap } from 'lucide-react'
import { useOmegaStore } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils'

export function StatusBar() {
  const { wsConnected, isAuthenticated, user } = useOmegaStore()
  const { logout } = useAuth()

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-3',
      'border-b border-omega-border bg-omega-surface/60 backdrop-blur-xl',
    )}>
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <motion.div
            className="w-6 h-6 rounded-full bg-gradient-to-br from-omega-cyan to-omega-purple"
            animate={{ boxShadow: ['0 0 8px rgba(0,245,255,0.4)', '0 0 16px rgba(0,245,255,0.8)', '0 0 8px rgba(0,245,255,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-omega-cyan/30 to-omega-purple/30 blur-sm" />
        </div>
        <span className="font-display text-sm font-bold tracking-[0.3em] text-neon-cyan">
          OMEGA
        </span>
        <span className="hidden sm:block font-ui text-xs text-omega-muted/50 tracking-wider">
          v1.0 // VOICE ASSISTANT
        </span>
      </div>

      {/* Center: Status indicators */}
      <div className="flex items-center gap-4">
        {/* WS Connection */}
        <div className="flex items-center gap-1.5">
          {wsConnected ? (
            <>
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-omega-green"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Wifi className="w-3.5 h-3.5 text-omega-green" />
              <span className="hidden md:block font-mono text-xs text-omega-green/70">LIVE</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
              <WifiOff className="w-3.5 h-3.5 text-red-400/60" />
              <span className="hidden md:block font-mono text-xs text-red-400/60">OFFLINE</span>
            </>
          )}
        </div>

        {/* Spotify status */}
        <div className="flex items-center gap-1.5">
          <motion.div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isAuthenticated ? 'bg-omega-green' : 'bg-omega-muted/40'
            )}
            animate={isAuthenticated ? { opacity: [1, 0.4, 1] } : { opacity: 0.4 }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <Radio className={cn('w-3.5 h-3.5', isAuthenticated ? 'text-omega-green' : 'text-omega-muted/40')} />
          <span className={cn(
            'hidden md:block font-mono text-xs',
            isAuthenticated ? 'text-omega-green/70' : 'text-omega-muted/40'
          )}>
            {isAuthenticated ? 'SPOTIFY' : 'NOT AUTH'}
          </span>
        </div>

        {/* Time */}
        <span className="hidden lg:block font-mono text-xs text-omega-muted/50">{now}</span>
      </div>

      {/* Right: User */}
      {isAuthenticated && user && (
        <div className="flex items-center gap-3">
          {user.images && user.images[0]?.url ? (
            <img
              src={user.images[0].url}
              alt={user.display_name || ''}
              className="w-7 h-7 rounded-full border border-omega-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-omega-panel border border-omega-border flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-omega-muted" />
            </div>
          )}
          <span className="hidden sm:block font-ui text-xs text-omega-muted truncate max-w-[100px]">
            {user.display_name || user.id}
          </span>
          {user.product === 'premium' && (
            <span className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-omega-green/10 text-omega-green text-[10px] font-display tracking-wider">
              <Zap className="w-2.5 h-2.5" />
              PREMIUM
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="p-1.5 rounded-lg text-omega-muted hover:text-omega-pink hover:bg-omega-pink/10 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      )}
    </div>
  )
}
