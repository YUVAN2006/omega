import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { LayoutDashboard, Search, History, Settings2 } from 'lucide-react'
import { VoiceOrb } from '@/components/voice/VoiceOrb'
import { TextCommandInput } from '@/components/voice/TextCommandInput'
import { NowPlayingCard } from '@/components/spotify/NowPlayingCard'
import { PlaybackControls } from '@/components/spotify/PlaybackControls'
import { DevicePanel } from '@/components/spotify/DevicePanel'
import { CommandHistory } from '@/components/dashboard/CommandHistory'
import { SearchPanel } from '@/components/dashboard/SearchPanel'
import { SystemStats } from '@/components/dashboard/SystemStats'
import { StatusBar } from '@/components/layout/StatusBar'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useOmegaStore } from '@/store'
import { cn } from '@/utils'

type Tab = 'dashboard' | 'search' | 'history' | 'system'

const NAV_TABS = [
  { id: 'dashboard' as Tab, icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'search' as Tab, icon: Search, label: 'Search' },
  { id: 'history' as Tab, icon: History, label: 'History' },
  { id: 'system' as Tab, icon: Settings2, label: 'System' },
]

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder()
  const { voiceStatus } = useOmegaStore()
  useWebSocket()

  return (
    <div className="flex flex-col h-screen bg-omega-bg overflow-hidden">
      {/* Grid background overlay */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(191,0,255,0.04) 0%, transparent 70%)' }}
          animate={{ scale: [1.3, 1, 1.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Status Bar */}
      <div className="relative z-20">
        <StatusBar />
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR: Voice + Player */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-omega-border bg-omega-surface/40 backdrop-blur-xl overflow-hidden">

          {/* Now Playing */}
          <div className="p-5 border-b border-omega-border">
            <NowPlayingCard />
          </div>

          {/* Playback Controls */}
          <div className="p-5 border-b border-omega-border">
            <PlaybackControls />
          </div>

          {/* Device selector */}
          <div className="px-5 py-3 border-b border-omega-border">
            <DevicePanel />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Voice hint at bottom */}
          <div className="p-4">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-display tracking-widest',
              'border transition-all duration-500',
              isRecording
                ? 'border-omega-cyan/50 text-omega-cyan bg-omega-cyan/5'
                : 'border-omega-border/50 text-omega-muted/50',
            )}>
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isRecording ? 'var(--omega-cyan)' : '#64748b' }}
                animate={isRecording ? { opacity: [1, 0.3, 1] } : { opacity: 0.5 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {isRecording ? 'RECORDING...' : voiceStatus === 'processing' ? 'PROCESSING' : 'READY'}
            </div>
          </div>
        </div>

        {/* CENTER: Voice Orb + Text Input */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 relative overflow-hidden">
          {/* Decorative corner lines */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-omega-cyan/20" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-omega-cyan/20" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-omega-cyan/20" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-omega-cyan/20" />

          {/* Cross-hair decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="w-px h-full bg-omega-cyan" />
            <div className="h-px w-full bg-omega-cyan absolute" />
          </div>

          {/* Voice Orb — main interaction element */}
          <div className="flex-1 flex items-center justify-center">
            <VoiceOrb onPress={startRecording} onRelease={stopRecording} />
          </div>

          {/* Text command input */}
          <div className="w-full max-w-md">
            <TextCommandInput />
          </div>

          {/* OMEGA tagline */}
          <div className="flex items-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-omega-cyan/30" />
            <p className="font-display text-[10px] tracking-[0.4em] text-omega-muted/30">
              VOICE // INTELLIGENCE // MUSIC
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-omega-cyan/30" />
          </div>
        </div>

        {/* RIGHT PANEL: Tab content */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-omega-border bg-omega-surface/40 backdrop-blur-xl overflow-hidden">
          {/* Tab nav */}
          <div className="flex border-b border-omega-border shrink-0">
            {NAV_TABS.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-display tracking-widest transition-all duration-200',
                  activeTab === id
                    ? 'text-omega-cyan border-b-2 border-omega-cyan bg-omega-cyan/5'
                    : 'text-omega-muted hover:text-omega-text border-b-2 border-transparent',
                )}
              >
                <Icon className="w-4 h-4" />
                {label.toUpperCase()}
              </motion.button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && (
                  <div className="p-4 h-full overflow-y-auto">
                    <SystemStats />
                  </div>
                )}
                {activeTab === 'search' && (
                  <div className="h-full flex flex-col">
                    <SearchPanel />
                  </div>
                )}
                {activeTab === 'history' && (
                  <div className="h-full flex flex-col">
                    <CommandHistory />
                  </div>
                )}
                {activeTab === 'system' && (
                  <div className="p-4 h-full overflow-y-auto">
                    <SystemStats />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
