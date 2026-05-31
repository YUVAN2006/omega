import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Loader2, Music2, User2, Disc3, ListMusic } from 'lucide-react'
import { spotifyApi } from '@/services/api'
import type { Track } from '@/types'
import { getAlbumArtwork, formatArtists, truncate, cn } from '@/utils'

type SearchType = 'track' | 'artist' | 'album' | 'playlist'

const TYPES: { value: SearchType; label: string; icon: React.ElementType }[] = [
  { value: 'track', label: 'Tracks', icon: Music2 },
  { value: 'artist', label: 'Artists', icon: User2 },
  { value: 'album', label: 'Albums', icon: Disc3 },
  { value: 'playlist', label: 'Playlists', icon: ListMusic },
]

function TrackRow({ track, onPlay }: { track: Track; onPlay: (uri: string) => void }) {
  const art = getAlbumArtwork(track.album.images, 'small')
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
      onClick={() => onPlay(track.uri)}
    >
      <div className="relative shrink-0">
        <img src={art} alt="" className="w-10 h-10 rounded-lg object-cover" />
        <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm text-omega-text truncate">{truncate(track.name, 30)}</p>
        <p className="font-ui text-xs text-omega-muted truncate">{formatArtists(track.artists)}</p>
      </div>
    </motion.div>
  )
}

function GenericRow({ item, onPlay }: { item: Record<string, unknown>; onPlay: (uri: string) => void }) {
  const images = (item.images as { url: string }[]) || []
  const art = images[0]?.url
  const name = String(item.name || '')
  const sub = String((item.owner as Record<string, unknown>)?.display_name || item.release_date || '')
  const uri = String(item.uri || '')

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
      onClick={() => uri && onPlay(uri)}
    >
      <div className="relative shrink-0">
        {art ? (
          <img src={art} alt="" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-omega-panel flex items-center justify-center border border-omega-border">
            <Music2 className="w-4 h-4 text-omega-muted" />
          </div>
        )}
        <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm text-omega-text truncate">{truncate(name, 30)}</p>
        {sub && <p className="font-ui text-xs text-omega-muted truncate">{sub}</p>}
      </div>
    </motion.div>
  )
}

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('track')
  const [results, setResults] = useState<{
    tracks: Track[]; artists: Record<string, unknown>[]; albums: Record<string, unknown>[]; playlists: Record<string, unknown>[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await spotifyApi.search(query, type, 10)
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [query, type])

  const playItem = async (uri: string) => {
    try {
      await spotifyApi.play(uri)
    } catch {}
  }

  const items = results
    ? type === 'track' ? results.tracks
    : type === 'artist' ? results.artists
    : type === 'album' ? results.albums
    : results.playlists
    : []

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4 space-y-3 border-b border-omega-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-omega-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Search Spotify..."
              className="omega-input w-full pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={doSearch}
            disabled={loading || !query.trim()}
            className={cn(
              'px-4 py-2.5 rounded-xl font-ui text-sm font-medium',
              'bg-omega-cyan/10 border border-omega-cyan/30 text-omega-cyan',
              'hover:bg-omega-cyan/20 transition-all duration-200',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </motion.button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1">
          {TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui transition-all duration-200',
                type === value
                  ? 'bg-omega-cyan/15 text-omega-cyan border border-omega-cyan/30'
                  : 'text-omega-muted hover:text-omega-text border border-transparent',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {!results && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-center"
            >
              <Search className="w-8 h-8 text-omega-muted/30 mb-3" />
              <p className="font-display text-xs tracking-widest text-omega-muted/40">SEARCH SPOTIFY</p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-32"
            >
              <Loader2 className="w-6 h-6 text-omega-cyan animate-spin" />
            </motion.div>
          )}

          {results && !loading && items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-32 text-center"
            >
              <p className="font-ui text-sm text-omega-muted">No results for "{query}"</p>
            </motion.div>
          )}

          {results && !loading && items.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {type === 'track'
                ? (items as Track[]).map((t) => <TrackRow key={t.id} track={t} onPlay={playItem} />)
                : (items as Record<string, unknown>[]).map((item, i) => (
                    <GenericRow key={String(item.id ?? i)} item={item} onPlay={playItem} />
                  ))
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
