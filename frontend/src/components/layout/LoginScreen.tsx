import { motion } from 'framer-motion'
import { Music2, Mic, Zap, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const features = [
  { icon: Mic, label: 'Voice Control', desc: 'Natural language commands' },
  { icon: Music2, label: 'Full Spotify Control', desc: 'Play, pause, search & more' },
  { icon: Zap, label: 'Instant Response', desc: 'Real-time AI intent engine' },
  { icon: Shield, label: 'Secure OAuth', desc: 'Spotify authorization flow' },
]

export function LoginScreen() {
  const { login } = useAuth()

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-omega-bg">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid opacity-100" />

      {/* Radial glows */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(191,0,255,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 glass-panel p-10 w-full max-w-md mx-4"
        style={{ boxShadow: '0 0 60px rgba(0,245,255,0.1), 0 30px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Orbiting particle */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="w-2 h-2 rounded-full bg-omega-cyan"
                style={{
                  boxShadow: '0 0 10px rgba(0,245,255,0.8)',
                  transform: 'translateX(42px)',
                }}
              />
            </motion.div>

            {/* Center orb */}
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,255,0.2) 0%, rgba(191,0,255,0.2) 100%)',
                border: '1px solid rgba(0,245,255,0.3)',
                boxShadow: '0 0 30px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1)',
              }}
              animate={{ boxShadow: [
                '0 0 30px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1)',
                '0 0 50px rgba(0,245,255,0.5), 0 0 80px rgba(0,245,255,0.2)',
                '0 0 30px rgba(0,245,255,0.3), 0 0 60px rgba(0,245,255,0.1)',
              ]}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Mic className="w-8 h-8 text-omega-cyan" />
            </motion.div>
          </div>

          <motion.h1
            className="font-display text-4xl font-black tracking-[0.4em] text-neon-cyan"
            animate={{ textShadow: [
              '0 0 10px rgba(0,245,255,0.8), 0 0 20px rgba(0,245,255,0.4)',
              '0 0 20px rgba(0,245,255,1), 0 0 40px rgba(0,245,255,0.6)',
              '0 0 10px rgba(0,245,255,0.8), 0 0 20px rgba(0,245,255,0.4)',
            ]}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            OMEGA
          </motion.h1>
          <p className="font-ui text-omega-muted text-sm tracking-widest mt-2">
            AI VOICE ASSISTANT
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-omega-cyan/50 to-transparent mt-3" />
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {features.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-white/2 border border-omega-border"
            >
              <Icon className="w-4 h-4 text-omega-cyan mt-0.5 shrink-0" />
              <div>
                <p className="font-ui text-xs font-semibold text-omega-text">{label}</p>
                <p className="font-ui text-xs text-omega-muted/60 mt-0.5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Login button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={login}
          className="w-full py-4 rounded-xl font-display text-sm tracking-[0.2em] font-bold relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(29,185,84,0.9), rgba(29,185,84,0.7))',
            boxShadow: '0 0 20px rgba(29,185,84,0.3)',
            border: '1px solid rgba(29,185,84,0.4)',
            color: '#000',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            CONNECT WITH SPOTIFY
          </span>
          <motion.div
            className="absolute inset-0 bg-white/10"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>

        <p className="text-center font-ui text-xs text-omega-muted/40 mt-4">
          Requires Spotify Premium for playback control
        </p>
      </motion.div>
    </div>
  )
}
