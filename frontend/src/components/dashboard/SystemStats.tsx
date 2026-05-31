import { motion } from 'framer-motion'
import { Activity, Cpu, Radio, Clock } from 'lucide-react'
import { useOmegaStore } from '@/store'
import { cn } from '@/utils'
import { useEffect, useState } from 'react'

interface StatItemProps {
  icon: React.ElementType
  label: string
  value: string
  color: string
  active?: boolean
}

function StatItem({ icon: Icon, label, value, color, active }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-omega-border">
      <div className={cn('p-2 rounded-lg', `bg-${color}/10`)}>
        <Icon className={cn('w-4 h-4', `text-${color}`)} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-[10px] tracking-widest text-omega-muted">{label}</p>
        <p className="font-mono text-xs text-omega-text truncate mt-0.5">{value}</p>
      </div>
      {active && (
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  )
}

export function SystemStats() {
  const { wsConnected, isAuthenticated, playbackState, voiceStatus, commandHistory } = useOmegaStore()
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${sec}s`
    return `${sec}s`
  }

  return (
    <div className="space-y-2">
      <p className="font-display text-xs tracking-widest text-omega-muted px-1 mb-3">SYSTEM STATUS</p>
      <StatItem
        icon={Radio}
        label="SPOTIFY"
        value={isAuthenticated ? 'CONNECTED' : 'DISCONNECTED'}
        color={isAuthenticated ? 'var(--omega-green)' : '#64748b'}
        active={isAuthenticated}
      />
      <StatItem
        icon={Activity}
        label="WEBSOCKET"
        value={wsConnected ? 'LIVE' : 'RECONNECTING'}
        color={wsConnected ? 'var(--omega-cyan)' : '#f59e0b'}
        active={wsConnected}
      />
      <StatItem
        icon={Cpu}
        label="VOICE ENGINE"
        value={voiceStatus.toUpperCase()}
        color={voiceStatus === 'listening' ? 'var(--omega-cyan)' : voiceStatus === 'processing' ? 'var(--omega-purple)' : voiceStatus === 'responding' ? 'var(--omega-green)' : '#64748b'}
        active={voiceStatus !== 'idle'}
      />
      <StatItem
        icon={Clock}
        label="SESSION"
        value={formatUptime(uptime)}
        color="var(--omega-muted)"
      />

      {/* Commands counter */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-omega-border">
        <span className="font-display text-[10px] tracking-widest text-omega-muted">COMMANDS EXECUTED</span>
        <motion.span
          key={commandHistory.length}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="font-mono text-sm font-bold text-omega-cyan"
        >
          {commandHistory.length}
        </motion.span>
      </div>

      {/* Playback info */}
      {playbackState?.device && (
        <div className="p-3 rounded-xl bg-white/2 border border-omega-border space-y-1">
          <p className="font-display text-[10px] tracking-widest text-omega-muted">ACTIVE DEVICE</p>
          <p className="font-mono text-xs text-omega-text">{playbackState.device.name}</p>
          <p className="font-ui text-xs text-omega-muted/60">{playbackState.device.type}</p>
        </div>
      )}
    </div>
  )
}
