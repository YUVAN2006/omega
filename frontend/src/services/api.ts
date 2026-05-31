import axios from 'axios'
import type { 
  AuthStatus, PlaybackState, Track, VoiceCommandResponse,
  CommandHistoryItem, PlaybackDevice
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authApi = {
  getStatus: () => api.get<AuthStatus>('/auth/status').then((r) => r.data),
  getLoginUrl: () => api.get<{ auth_url: string }>('/auth/login').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: () => api.get('/auth/refresh').then((r) => r.data),
}

// ─── Spotify ──────────────────────────────────────────────────────────────

export const spotifyApi = {
  getPlayback: () => api.get<PlaybackState>('/spotify/playback').then((r) => r.data),
  getCurrentTrack: () => api.get<Track>('/spotify/track').then((r) => r.data),

  play: (uri?: string, deviceId?: string) =>
    api.post('/spotify/play', { uri, device_id: deviceId }).then((r) => r.data),
  pause: () => api.post('/spotify/pause').then((r) => r.data),
  resume: () => api.post('/spotify/resume').then((r) => r.data),
  next: () => api.post('/spotify/next').then((r) => r.data),
  previous: () => api.post('/spotify/previous').then((r) => r.data),
  setVolume: (volume: number) =>
    api.post('/spotify/volume', { volume_percent: volume }).then((r) => r.data),
  seek: (positionMs: number) =>
    api.post('/spotify/seek', { position_ms: positionMs }).then((r) => r.data),
  toggleShuffle: (state: boolean) =>
    api.post(`/spotify/shuffle/${state}`).then((r) => r.data),
  setRepeat: (state: 'off' | 'track' | 'context') =>
    api.post(`/spotify/repeat/${state}`).then((r) => r.data),

  search: (q: string, type = 'track', limit = 10) =>
    api.get('/spotify/search', { params: { q, type, limit } }).then((r) => r.data),

  playSong: (query: string) =>
    api.post('/spotify/play/song', { query }).then((r) => r.data),
  playArtist: (query: string) =>
    api.post('/spotify/play/artist', { query }).then((r) => r.data),
  playAlbum: (query: string) =>
    api.post('/spotify/play/album', { query }).then((r) => r.data),
  playPlaylist: (query: string) =>
    api.post('/spotify/play/playlist', { query }).then((r) => r.data),

  getDevices: () =>
    api.get<{ devices: PlaybackDevice[] }>('/spotify/devices').then((r) => r.data),
  transferPlayback: (deviceId: string) =>
    api.post(`/spotify/devices/${deviceId}/transfer`).then((r) => r.data),

  getUserPlaylists: (limit = 20) =>
    api.get('/spotify/playlists', { params: { limit } }).then((r) => r.data),
}

// ─── Voice ────────────────────────────────────────────────────────────────

export const voiceApi = {
  sendTextCommand: (text: string) =>
    api.post<VoiceCommandResponse>('/voice/command', { text }).then((r) => r.data),
  sendAudioCommand: (audioBase64: string) =>
    api.post<VoiceCommandResponse>('/voice/command', { audio_base64: audioBase64 }).then((r) => r.data),
  getHistory: (limit = 20) =>
    api.get<{ history: CommandHistoryItem[] }>('/voice/history', { params: { limit } }).then((r) => r.data),
  getStatus: () => api.get('/voice/status').then((r) => r.data),
  speak: (text: string) =>
    api.post('/voice/tts', null, { params: { text } }).then((r) => r.data),
}

export default api
