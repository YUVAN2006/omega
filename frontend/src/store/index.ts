import { create } from 'zustand'
import type {
  PlaybackState, SpotifyUser, CommandHistoryItem,
  VoiceStatus, AuthStatus
} from '@/types'

interface OmegaState {
  // Auth
  isAuthenticated: boolean
  user: SpotifyUser | null
  setAuth: (status: AuthStatus) => void
  logout: () => void

  // Playback
  playbackState: PlaybackState | null
  setPlaybackState: (state: PlaybackState) => void

  // Voice
  voiceStatus: VoiceStatus
  setVoiceStatus: (status: VoiceStatus) => void
  isListening: boolean
  setIsListening: (v: boolean) => void
  wakeWordActive: boolean
  setWakeWordActive: (v: boolean) => void
  lastTranscription: string
  setLastTranscription: (t: string) => void

  // Command history
  commandHistory: CommandHistoryItem[]
  addCommand: (item: CommandHistoryItem) => void
  clearHistory: () => void

  // UI state
  wsConnected: boolean
  setWsConnected: (v: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  isRecording: boolean
  setIsRecording: (v: boolean) => void

  // Local progress tracking
  localProgress: number
  setLocalProgress: (ms: number) => void
}

export const useOmegaStore = create<OmegaState>((set) => ({
  // Auth
  isAuthenticated: false,
  user: null,
  setAuth: (status) => set({ isAuthenticated: status.authenticated, user: status.user }),
  logout: () => set({ isAuthenticated: false, user: null, playbackState: null }),

  // Playback
  playbackState: null,
  setPlaybackState: (state) => set({ playbackState: state, localProgress: state.progress_ms }),

  // Voice
  voiceStatus: 'idle',
  setVoiceStatus: (status) => set({ voiceStatus: status }),
  isListening: false,
  setIsListening: (v) => set({ isListening: v }),
  wakeWordActive: false,
  setWakeWordActive: (v) => set({ wakeWordActive: v }),
  lastTranscription: '',
  setLastTranscription: (t) => set({ lastTranscription: t }),

  // Command history
  commandHistory: [],
  addCommand: (item) =>
    set((s) => ({ commandHistory: [item, ...s.commandHistory].slice(0, 50) })),
  clearHistory: () => set({ commandHistory: [] }),

  // UI state
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isRecording: false,
  setIsRecording: (v) => set({ isRecording: v }),

  // Progress
  localProgress: 0,
  setLocalProgress: (ms) => set({ localProgress: ms }),
}))
