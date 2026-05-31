import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Terminal } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { cn } from '@/utils'

const PLACEHOLDER_COMMANDS = [
  'Play Blinding Lights by The Weeknd...',
  'Skip this track...',
  'Set volume to 70...',
  'Play something by Daft Punk...',
  'Shuffle my playlist...',
  'What song is playing?...',
]

export function TextCommandInput() {
  const [text, setText] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { sendTextCommand } = useVoiceRecorder()

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_COMMANDS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim()) return
    const cmd = text.trim()
    setText('')
    await sendTextCommand(cmd)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-xl border transition-all duration-300',
          'bg-omega-panel/60 backdrop-blur-sm px-4 py-3',
          isFocused
            ? 'border-omega-cyan/50 shadow-[0_0_20px_rgba(0,245,255,0.15)]'
            : 'border-omega-border',
        )}
      >
        {/* Terminal icon */}
        <Terminal className="w-4 h-4 text-omega-muted shrink-0" />

        {/* Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-transparent font-ui text-sm text-omega-text',
              'placeholder-transparent focus:outline-none',
              'caret-omega-cyan',
            )}
            style={{ caretColor: 'var(--omega-cyan)' }}
            spellCheck={false}
          />

          {/* Animated placeholder */}
          <AnimatePresence mode="wait">
            {!text && !isFocused && (
              <motion.span
                key={placeholderIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.4, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pointer-events-none font-ui text-sm text-omega-muted"
              >
                {PLACEHOLDER_COMMANDS[placeholderIdx]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSubmit()}
          disabled={!text.trim()}
          className={cn(
            'p-1.5 rounded-lg transition-all duration-200',
            text.trim()
              ? 'text-omega-cyan hover:bg-omega-cyan/10'
              : 'text-omega-muted/30 cursor-not-allowed',
          )}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Suggestion pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {['▶ Play', '⏭ Skip', '⏸ Pause', '🔊 Volume'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              const cmd = suggestion.replace(/^[^\s]+\s/, '').toLowerCase()
              sendTextCommand(cmd)
            }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-ui',
              'border border-omega-border text-omega-muted',
              'hover:border-omega-cyan/40 hover:text-omega-cyan',
              'transition-all duration-200',
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
