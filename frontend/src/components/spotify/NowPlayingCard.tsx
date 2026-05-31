import { motion, AnimatePresence } from 'framer-motion'
import { Music2 } from 'lucide-react'
import { useOmegaStore } from '@/store'
import { getAlbumArtwork, formatArtists, truncate } from '@/utils'

export function NowPlayingCard() {
  const { playbackState } = useOmegaStore()
  const track = playbackState?.track

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-omega-muted">
        <div className="w-24 h-24 rounded-2xl bg-omega-panel/60 flex items-center justify-center border border-omega-border">
          <Music2 className="w-10 h-10 text-omega-muted/40" />
        </div>
        <div className="text-center">
          <p className="font-display text-xs tracking-widest text-omega-muted/50">NOTHING PLAYING</p>
          <p className="font-ui text-xs text-omega-muted/30 mt-1">Say "Omega, play something"</p>
        </div>
      </div>
    )
  }

  const artwork = getAlbumArtwork(track.album.images, 'large')

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={track.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-5"
      >
        {/* Album Art */}
        <div className="relative group">
          {/* Glow behind artwork */}
          <motion.div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-40"
            style={{ background: 'var(--omega-cyan)', transform: 'scale(0.8) translateY(10px)' }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.img
            src={artwork}
            alt={track.album.name}
            className="relative z-10 w-52 h-52 rounded-2xl object-cover shadow-glass-lg"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,245,255,0.15)',
            }}
            initial={{ rotateY: -10, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="208" height="208" fill="%23111827"%3E%3Crect width="208" height="208" rx="16"/%3E%3C/svg%3E'
            }}
          />

          {/* Playing indicator overlay */}
          {playbackState?.is_playing && (
            <motion.div
              className="absolute inset-0 z-20 rounded-2xl flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute bottom-3 right-3 flex items-end gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-omega-cyan"
                    animate={{ height: [4, 14, 4, 18, 4] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Track info */}
        <div className="text-center space-y-1 px-4 w-full max-w-xs">
          <motion.h3
            key={track.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-semibold text-lg text-omega-text leading-tight"
          >
            {truncate(track.name, 28)}
          </motion.h3>

          <motion.p
            key={track.artists[0]?.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-ui text-omega-muted text-sm"
          >
            {formatArtists(track.artists)}
          </motion.p>

          <motion.p
            key={track.album.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.1 }}
            className="font-ui text-omega-muted/60 text-xs"
          >
            {truncate(track.album.name, 32)}
          </motion.p>

          {/* Explicit badge */}
          {track.explicit && (
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono border border-omega-muted/30 text-omega-muted/60 rounded">
              E
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
