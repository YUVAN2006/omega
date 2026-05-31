import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function msToTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getAlbumArtwork(images: Array<{ url: string; width?: number; height?: number }>, size: 'small' | 'medium' | 'large' = 'medium'): string {
  if (!images || images.length === 0) return '/placeholder-album.png'
  
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0))
  
  if (size === 'large') return sorted[0]?.url || ''
  if (size === 'small') return sorted[sorted.length - 1]?.url || sorted[0]?.url || ''
  return sorted[Math.floor(sorted.length / 2)]?.url || sorted[0]?.url || ''
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen - 3) + '...'
}

export function formatArtists(artists: Array<{ name: string }>): string {
  return artists.map((a) => a.name).join(', ')
}

export function parseApiError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (e.detail) return String(e.detail)
    if (e.message) return String(e.message)
  }
  return 'An unexpected error occurred'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function getIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    play_song: '▶ Play Song',
    play_artist: '▶ Play Artist',
    play_album: '▶ Play Album',
    play_playlist: '▶ Play Playlist',
    pause: '⏸ Pause',
    resume: '▶ Resume',
    next: '⏭ Next Track',
    previous: '⏮ Previous',
    volume_up: '🔊 Volume Up',
    volume_down: '🔉 Volume Down',
    set_volume: '🔊 Set Volume',
    mute: '🔇 Mute',
    shuffle_on: '🔀 Shuffle On',
    shuffle_off: '🔀 Shuffle Off',
    repeat_on: '🔁 Repeat On',
    repeat_off: '🔁 Repeat Off',
    now_playing: '🎵 Now Playing',
    get_devices: '📱 Get Devices',
    like_song: '❤️ Like Song',
  }
  return labels[intent] || intent
}

export function base64EncodeAudio(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
