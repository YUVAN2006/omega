import { useEffect, useCallback, useRef } from 'react'
import { useOmegaStore } from '@/store'
import { spotifyApi } from '@/services/api'

export function usePlayback() {
  const {
    isAuthenticated, playbackState, setPlaybackState,
    localProgress, setLocalProgress,
  } = useOmegaStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPlayback = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const state = await spotifyApi.getPlayback()
      if (state) setPlaybackState(state)
    } catch {
      // silent — WS handles updates too
    }
  }, [isAuthenticated, setPlaybackState])

  // Poll every 5 seconds as a fallback
  useEffect(() => {
    if (!isAuthenticated) return
    fetchPlayback()
    intervalRef.current = setInterval(fetchPlayback, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated, fetchPlayback])

  // Local progress ticker (smooth progress bar)
  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    if (playbackState?.is_playing) {
      progressRef.current = setInterval(() => {
        setLocalProgress(localProgress + 1000)
      }, 1000)
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [playbackState?.is_playing, playbackState?.progress_ms])

  const togglePlay = async () => {
    if (!playbackState) return
    try {
      if (playbackState.is_playing) {
        await spotifyApi.pause()
        setPlaybackState({ ...playbackState, is_playing: false })
      } else {
        await spotifyApi.resume()
        setPlaybackState({ ...playbackState, is_playing: true })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const skip = async () => {
    try {
      await spotifyApi.next()
      setTimeout(fetchPlayback, 500)
    } catch {}
  }

  const previous = async () => {
    try {
      await spotifyApi.previous()
      setTimeout(fetchPlayback, 500)
    } catch {}
  }

  const setVolume = async (volume: number) => {
    try {
      await spotifyApi.setVolume(volume)
      if (playbackState?.device) {
        setPlaybackState({
          ...playbackState,
          device: { ...playbackState.device, volume_percent: volume },
        })
      }
    } catch {}
  }

  const seek = async (positionMs: number) => {
    try {
      await spotifyApi.seek(positionMs)
      setLocalProgress(positionMs)
      if (playbackState) {
        setPlaybackState({ ...playbackState, progress_ms: positionMs })
      }
    } catch {}
  }

  const toggleShuffle = async () => {
    if (!playbackState) return
    try {
      await spotifyApi.toggleShuffle(!playbackState.shuffle_state)
      setPlaybackState({ ...playbackState, shuffle_state: !playbackState.shuffle_state })
    } catch {}
  }

  const cycleRepeat = async () => {
    if (!playbackState) return
    const next = playbackState.repeat_state === 'off' ? 'context'
      : playbackState.repeat_state === 'context' ? 'track'
      : 'off'
    try {
      await spotifyApi.setRepeat(next)
      setPlaybackState({ ...playbackState, repeat_state: next })
    } catch {}
  }

  return {
    playbackState,
    localProgress,
    togglePlay,
    skip,
    previous,
    setVolume,
    seek,
    toggleShuffle,
    cycleRepeat,
    refetch: fetchPlayback,
  }
}
