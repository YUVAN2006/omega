import { useEffect } from 'react'
import { wsService } from '@/services/websocket'
import { useOmegaStore } from '@/store'
import type { PlaybackState, WSMessage, CommandHistoryItem } from '@/types'

export function useWebSocket() {
  const {
    isAuthenticated,
    setPlaybackState, setWsConnected,
    setWakeWordActive, setIsListening,
    addCommand,
  } = useOmegaStore()

  useEffect(() => {
    if (!isAuthenticated) return

    wsService.connect()

    const unsubMsg = wsService.onMessage((msg: WSMessage) => {
      switch (msg.type) {
        case 'playback_update': {
          const state = msg.data as PlaybackState
          if (state) setPlaybackState(state)
          break
        }
        case 'voice_status': {
          const vs = msg.data as { listening: boolean; wake_word_active: boolean }
          setIsListening(vs.listening)
          setWakeWordActive(vs.wake_word_active)
          break
        }
        case 'command_result': {
          const item = msg.data as CommandHistoryItem
          if (item) addCommand(item)
          break
        }
        default:
          break
      }
    })

    const unsubStatus = wsService.onStatus((connected) => {
      setWsConnected(connected)
    })

    return () => {
      unsubMsg()
      unsubStatus()
    }
  }, [isAuthenticated])

  return { isConnected: wsService.isConnected }
}
