// ─── Spotify Types ─────────────────────────────────────────────────────────

export interface TrackArtist {
  id: string
  name: string
}

export interface TrackAlbum {
  id: string
  name: string
  images: SpotifyImage[]
  release_date?: string
}

export interface SpotifyImage {
  url: string
  height?: number
  width?: number
}

export interface Track {
  id: string
  name: string
  artists: TrackArtist[]
  album: TrackAlbum
  duration_ms: number
  explicit: boolean
  popularity?: number
  uri: string
  preview_url?: string
}

export interface PlaybackDevice {
  id: string | null
  name: string
  type: string
  is_active: boolean
  volume_percent: number | null
}

export interface PlaybackState {
  is_playing: boolean
  track: Track | null
  progress_ms: number
  device: PlaybackDevice | null
  shuffle_state: boolean
  repeat_state: 'off' | 'track' | 'context'
  timestamp?: number
}

export interface SpotifyUser {
  id: string
  display_name?: string
  email?: string
  images?: SpotifyImage[]
  product?: string
}

export interface AuthStatus {
  authenticated: boolean
  user: SpotifyUser | null
}

// ─── Voice / Intent Types ───────────────────────────────────────────────────

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'responding' | 'error'

export interface ParsedIntent {
  intent: string
  query?: string
  volume?: number
  raw_text: string
  confidence: number
}

export interface VoiceCommandResponse {
  success: boolean
  transcribed_text?: string
  intent?: ParsedIntent
  action_result?: unknown
  response_text: string
  error?: string
}

export interface CommandHistoryItem {
  id: string
  timestamp: string
  raw_text: string
  intent: string
  query?: string
  success: boolean
  response_text: string
}

// ─── WebSocket Messages ─────────────────────────────────────────────────────

export type WSMessageType = 'playback_update' | 'voice_status' | 'command_result' | 'error'

export interface WSMessage {
  type: WSMessageType
  data: unknown
}

export interface WSVoiceStatus {
  listening: boolean
  wake_word_active: boolean
}

// ─── UI State ───────────────────────────────────────────────────────────────

export type Theme = 'dark'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export interface OmegaTab {
  id: string
  label: string
  icon: string
}
