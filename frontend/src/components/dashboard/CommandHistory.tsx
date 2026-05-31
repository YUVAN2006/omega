import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Trash2, Clock } from 'lucide-react'
import { useOmegaStore } from '@/store'
import { getIntentLabel, truncate } from '@/utils'
import { cn } from '@/utils'

export function CommandHistory() {
  const { commandHistory, clearHistory } = useOmegaStore()

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-omega-border shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-omega-muted" />
          <span className="font-display text-xs tracking-widest text-omega-muted">COMMAND LOG</span>
          {commandHistory.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-omega-cyan/10 text-omega-cyan text-[10px] font-mono">
              {commandHistory.length}
            </span>
          )}
        </div>
        {commandHistory.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-omega-muted hover:text-omega-pink hover:bg-omega-pink/10 transition-all duration-200"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        <AnimatePresence initial={false}>
          {commandHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-32 text-center px-4"
            >
              <p className="font-display text-xs tracking-widest text-omega-muted/40">
                NO COMMANDS YET
              </p>
              <p className="font-ui text-xs text-omega-muted/25 mt-2">
                Speak or type a command
              </p>
            </motion.div>
          ) : (
            commandHistory.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25, delay: idx === 0 ? 0 : 0 }}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b border-omega-border/50',
                  'hover:bg-white/2 transition-colors duration-150',
                  idx === 0 && 'bg-omega-cyan/3',
                )}
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {item.success ? (
                    <CheckCircle2 className="w-4 h-4 text-omega-green" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-ui text-sm text-omega-text truncate">
                    "{truncate(item.raw_text, 40)}"
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'text-[10px] font-display tracking-wider px-1.5 py-0.5 rounded',
                      item.success
                        ? 'text-omega-cyan/80 bg-omega-cyan/10'
                        : 'text-red-400/80 bg-red-400/10',
                    )}>
                      {getIntentLabel(item.intent)}
                    </span>
                    {item.query && (
                      <span className="text-[10px] font-ui text-omega-muted/60 truncate max-w-[100px]">
                        "{item.query}"
                      </span>
                    )}
                  </div>
                  <p className="font-ui text-xs text-omega-muted/50 truncate">
                    {item.response_text}
                  </p>
                </div>

                {/* Time */}
                <span className="font-mono text-[10px] text-omega-muted/40 shrink-0 mt-0.5">
                  {formatTime(item.timestamp)}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
