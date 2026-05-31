import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useOmegaStore } from '@/store'
import { cn } from '@/utils'
import type { VoiceStatus } from '@/types'

interface VoiceOrbProps {
  onPress: () => void
  onRelease: () => void
}

const statusConfig: Record<VoiceStatus, {
  label: string
  color: string
  glow: string
  rings: number
  pulse: boolean
}> = {
  idle: {
    label: 'PRESS & HOLD',
    color: 'from-cyan-500/20 to-purple-500/20 border-cyan-500/30',
    glow: 'rgba(0,245,255,0.3)',
    rings: 2,
    pulse: false,
  },
  listening: {
    label: 'LISTENING...',
    color: 'from-cyan-400/40 to-cyan-500/20 border-cyan-400/60',
    glow: 'rgba(0,245,255,0.7)',
    rings: 4,
    pulse: true,
  },
  processing: {
    label: 'PROCESSING...',
    color: 'from-purple-500/40 to-pink-500/20 border-purple-500/60',
    glow: 'rgba(191,0,255,0.6)',
    rings: 3,
    pulse: true,
  },
  responding: {
    label: 'RESPONDING',
    color: 'from-green-500/40 to-cyan-500/20 border-green-500/60',
    glow: 'rgba(29,185,84,0.6)',
    rings: 3,
    pulse: true,
  },
  error: {
    label: 'ERROR',
    color: 'from-red-500/40 to-pink-500/20 border-red-500/60',
    glow: 'rgba(255,50,50,0.6)',
    rings: 2,
    pulse: false,
  },
}

export function VoiceOrb({ onPress, onRelease }: VoiceOrbProps) {
  const { voiceStatus, isRecording, lastTranscription, wakeWordActive } = useOmegaStore()
  const config = statusConfig[voiceStatus]

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Orb container */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>

        {/* Outer glow bloom */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
          }}
          animate={config.pulse ? { opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] } : { opacity: 0.4 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Pulse rings */}
        {config.pulse && Array.from({ length: config.rings }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{
              borderColor: config.glow,
              width: 160 + i * 30,
              height: 160 + i * 30,
            }}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Static rings when idle */}
        {!config.pulse && (
          <>
            <div
              className="absolute rounded-full border border-cyan-500/15"
              style={{ width: 170, height: 170 }}
            />
            <div
              className="absolute rounded-full border border-cyan-500/08"
              style={{ width: 190, height: 190 }}
            />
          </>
        )}

        {/* Orbiting dot */}
        <motion.div
          className="absolute"
          style={{ width: 8, height: 8 }}
          animate={voiceStatus !== 'idle' ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 8, height: 8,
              background: config.glow,
              boxShadow: `0 0 10px ${config.glow}`,
              transform: 'translateX(80px)',
            }}
          />
        </motion.div>

        {/* Main orb button */}
        <motion.button
          className={cn(
            'relative z-10 w-36 h-36 rounded-full',
            'bg-gradient-to-br border-2',
            'flex items-center justify-center',
            'cursor-pointer backdrop-blur-sm',
            'transition-colors duration-300',
            config.color,
          )}
          style={{
            boxShadow: `0 0 30px ${config.glow}, 0 0 60px ${config.glow}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={onPress}
          onMouseUp={onRelease}
          onTouchStart={onPress}
          onTouchEnd={onRelease}
        >
          {/* Inner orb gradient */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/5 to-transparent" />

          {/* Icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={voiceStatus}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {voiceStatus === 'processing' ? (
                <Loader2 className="w-10 h-10 text-purple-300 animate-spin" />
              ) : voiceStatus === 'listening' || isRecording ? (
                <MicOff className="w-10 h-10 text-cyan-300" />
              ) : (
                <Mic className="w-10 h-10 text-cyan-400" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Audio visualizer bars when listening */}
          {(voiceStatus === 'listening') && (
            <div className="absolute bottom-6 flex items-end gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-cyan-400"
                  animate={{ height: [4, 16, 4, 20, 4] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          )}
        </motion.button>
      </div>

      {/* Status label */}
      <div className="text-center space-y-2">
        <motion.p
          key={voiceStatus}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-xs tracking-[0.3em] font-semibold"
          style={{ color: config.glow }}
        >
          {wakeWordActive ? 'WAKE WORD DETECTED' : config.label}
        </motion.p>

        {/* Last transcription */}
        <AnimatePresence>
          {lastTranscription && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-omega-muted font-ui text-xs max-w-[200px] text-center leading-relaxed"
            >
              "{lastTranscription}"
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      <p className="text-omega-muted/50 font-ui text-xs tracking-widest">
        SAY "OMEGA" OR PRESS & HOLD
      </p>
    </div>
  )
}
