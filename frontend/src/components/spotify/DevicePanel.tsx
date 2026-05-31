import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Smartphone, Speaker, Tv, ChevronDown, Loader2, Wifi } from 'lucide-react'
import { spotifyApi } from '@/services/api'
import type { PlaybackDevice } from '@/types'
import { cn } from '@/utils'

const deviceIcons: Record<string, React.ElementType> = {
  Computer: Monitor,
  Smartphone: Smartphone,
  Speaker: Speaker,
  TV: Tv,
  default: Monitor,
}

function DeviceIcon({ type }: { type: string }) {
  const Icon = deviceIcons[type] ?? deviceIcons.default
  return <Icon className="w-4 h-4" />
}

export function DevicePanel() {
  const [devices, setDevices] = useState<PlaybackDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [transferring, setTransferring] = useState<string | null>(null)

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const data = await spotifyApi.getDevices()
      setDevices(data.devices)
    } catch {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    const i = setInterval(fetchDevices, 30000)
    return () => clearInterval(i)
  }, [])

  const transfer = async (deviceId: string) => {
    setTransferring(deviceId)
    try {
      await spotifyApi.transferPlayback(deviceId)
      await fetchDevices()
    } catch {}
    setTransferring(null)
  }

  const activeDevice = devices.find((d) => d.is_active)

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchDevices() }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-ui',
          'transition-all duration-200',
          open
            ? 'border-omega-cyan/40 text-omega-cyan bg-omega-cyan/5'
            : 'border-omega-border text-omega-muted hover:border-omega-border/80 hover:text-omega-text',
        )}
      >
        <Wifi className="w-3.5 h-3.5" />
        <span className="truncate max-w-[120px]">
          {activeDevice ? activeDevice.name : 'No device'}
        </span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute bottom-full mb-2 right-0 z-50',
              'w-64 rounded-xl border border-omega-border',
              'bg-omega-panel/95 backdrop-blur-xl shadow-glass-lg',
              'overflow-hidden',
            )}
          >
            <div className="px-3 py-2 border-b border-omega-border flex items-center justify-between">
              <span className="font-display text-xs tracking-widest text-omega-muted">DEVICES</span>
              {loading && <Loader2 className="w-3 h-3 text-omega-muted animate-spin" />}
            </div>

            {devices.length === 0 && !loading ? (
              <div className="px-4 py-5 text-center">
                <p className="text-omega-muted text-xs font-ui">No devices found</p>
                <p className="text-omega-muted/50 text-xs mt-1">Open Spotify on a device</p>
              </div>
            ) : (
              <div className="py-1">
                {devices.map((device) => (
                  <motion.button
                    key={device.id ?? device.name}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => device.id && !device.is_active && transfer(device.id)}
                    disabled={device.is_active || !device.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left',
                      'transition-colors duration-150',
                      device.is_active
                        ? 'text-omega-cyan cursor-default'
                        : 'text-omega-text hover:bg-white/5 cursor-pointer',
                    )}
                  >
                    <DeviceIcon type={device.type} />
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-sm truncate">{device.name}</p>
                      <p className="font-ui text-xs text-omega-muted/60">{device.type}</p>
                    </div>
                    {device.is_active && (
                      <span className="text-[10px] font-display tracking-widest text-omega-cyan">
                        ACTIVE
                      </span>
                    )}
                    {transferring === device.id && (
                      <Loader2 className="w-3 h-3 animate-spin text-omega-muted" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
