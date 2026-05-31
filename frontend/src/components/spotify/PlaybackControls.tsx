import { motion } from 'framer-motion'
import {
  SkipBack, SkipForward, Play, Pause,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
} from 'lucide-react'
import * as Slider from '@radix-ui/react-slider'
import { usePlayback } from '@/hooks/usePlayback'
import { msToTime, cn } from '@/utils'

export function PlaybackControls() {
  const {
    playbackState,
    localProgress,
    togglePlay,
    skip,
    previous,
    setVolume,
    seek,
    toggleShuffle,
    cycleRepeat,
  } = usePlayback()

  const duration = playbackState?.track?.duration_ms ?? 0
  const progress = Math.min(localProgress, duration)
  const volume = playbackState?.device?.volume_percent ?? 50
  const isPlaying = playbackState?.is_playing ?? false
  const shuffle = playbackState?.shuffle_state ?? false
  const repeat = playbackState?.repeat_state ?? 'off'

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-omega-muted w-9 text-right">
          {msToTime(progress)}
        </span>
        <Slider.Root
          className="relative flex items-center flex-1 h-4 cursor-pointer group"
          min={0}
          max={duration || 1}
          value={[progress]}
          onValueChange={([val]) => seek(val)}
        >
          <Slider.Track className="relative h-1 flex-1 rounded-full overflow-hidden bg-white/10">
            <Slider.Range className="absolute h-full rounded-full bg-gradient-to-r from-omega-cyan to-omega-purple" />
          </Slider.Track>
          <Slider.Thumb className="block w-3 h-3 rounded-full bg-omega-cyan opacity-0 group-hover:opacity-100 transition-opacity shadow-neon-cyan focus:outline-none" />
        </Slider.Root>
        <span className="font-mono text-xs text-omega-muted w-9">
          {msToTime(duration)}
        </span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-5">
        {/* Shuffle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleShuffle}
          className={cn(
            'p-2 rounded-lg transition-all duration-200',
            shuffle
              ? 'text-omega-cyan'
              : 'text-omega-muted hover:text-omega-text',
          )}
          title="Shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </motion.button>

        {/* Previous */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={previous}
          className="p-2 rounded-xl text-omega-text/80 hover:text-omega-text transition-colors"
          title="Previous"
        >
          <SkipBack className="w-5 h-5" />
        </motion.button>

        {/* Play / Pause */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={togglePlay}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-omega-cyan/80 to-omega-purple/60',
            'shadow-neon-cyan border border-omega-cyan/40',
            'transition-all duration-200',
          )}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-omega-bg fill-omega-bg" />
          ) : (
            <Play className="w-6 h-6 text-omega-bg fill-omega-bg translate-x-0.5" />
          )}
        </motion.button>

        {/* Next */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={skip}
          className="p-2 rounded-xl text-omega-text/80 hover:text-omega-text transition-colors"
          title="Skip"
        >
          <SkipForward className="w-5 h-5" />
        </motion.button>

        {/* Repeat */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={cycleRepeat}
          className={cn(
            'p-2 rounded-lg transition-all duration-200',
            repeat !== 'off'
              ? 'text-omega-cyan'
              : 'text-omega-muted hover:text-omega-text',
          )}
          title={`Repeat: ${repeat}`}
        >
          {repeat === 'track' ? (
            <Repeat1 className="w-4 h-4" />
          ) : (
            <Repeat className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setVolume(volume === 0 ? 50 : 0)}
          className="text-omega-muted hover:text-omega-text transition-colors"
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </motion.button>
        <Slider.Root
          className="relative flex items-center flex-1 h-4 cursor-pointer group"
          min={0}
          max={100}
          value={[volume]}
          onValueChange={([val]) => setVolume(val)}
        >
          <Slider.Track className="relative h-1 flex-1 rounded-full bg-white/10">
            <Slider.Range className="absolute h-full rounded-full bg-gradient-to-r from-omega-cyan to-omega-purple" />
          </Slider.Track>
          <Slider.Thumb className="block w-3 h-3 rounded-full bg-omega-cyan opacity-0 group-hover:opacity-100 transition-opacity shadow-neon-cyan focus:outline-none" />
        </Slider.Root>
        <span className="font-mono text-xs text-omega-muted w-8 text-right">
          {volume}%
        </span>
      </div>
    </div>
  )
}
