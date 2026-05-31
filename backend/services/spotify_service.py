"""
OMEGA — Spotify Service
Complete Spotify playback control via Spotipy.
"""

from __future__ import annotations
import logging
from typing import Optional, List

import spotipy

from services.auth_service import get_auth_service
from models.schemas import (
    PlaybackState, Track, TrackArtist, TrackAlbum,
    PlaybackDevice, SearchResult
)

logger = logging.getLogger("omega.spotify")


def _parse_track(item: dict) -> Optional[Track]:
    if not item:
        return None
    try:
        return Track(
            id=item["id"],
            name=item["name"],
            artists=[TrackArtist(id=a["id"], name=a["name"]) for a in item.get("artists", [])],
            album=TrackAlbum(
                id=item["album"]["id"],
                name=item["album"]["name"],
                images=item["album"].get("images", []),
                release_date=item["album"].get("release_date"),
            ),
            duration_ms=item.get("duration_ms", 0),
            explicit=item.get("explicit", False),
            popularity=item.get("popularity"),
            uri=item["uri"],
            preview_url=item.get("preview_url"),
        )
    except Exception as e:
        logger.error(f"Error parsing track: {e}")
        return None


def _parse_device(device: dict) -> PlaybackDevice:
    return PlaybackDevice(
        id=device.get("id"),
        name=device.get("name", "Unknown"),
        type=device.get("type", "Unknown"),
        is_active=device.get("is_active", False),
        volume_percent=device.get("volume_percent"),
    )


class SpotifyService:
    def __init__(self):
        self.auth = get_auth_service()

    def _sp(self) -> Optional[spotipy.Spotify]:
        return self.auth.get_spotify_client()

    # ------------------------------------------------------------------
    # Playback State
    # ------------------------------------------------------------------

    def get_playback_state(self) -> Optional[PlaybackState]:
        sp = self._sp()
        if not sp:
            return None
        try:
            data = sp.current_playback()
            if not data:
                return PlaybackState(is_playing=False)

            track = _parse_track(data.get("item")) if data.get("item") else None
            device = _parse_device(data["device"]) if data.get("device") else None

            return PlaybackState(
                is_playing=data.get("is_playing", False),
                track=track,
                progress_ms=data.get("progress_ms", 0),
                device=device,
                shuffle_state=data.get("shuffle_state", False),
                repeat_state=data.get("repeat_state", "off"),
                timestamp=data.get("timestamp"),
            )
        except spotipy.SpotifyException as e:
            logger.error(f"Spotify API error in get_playback_state: {e}")
            return None

    def get_current_track(self) -> Optional[Track]:
        sp = self._sp()
        if not sp:
            return None
        try:
            data = sp.current_user_playing_track()
            if not data or not data.get("item"):
                return None
            return _parse_track(data["item"])
        except Exception as e:
            logger.error(f"Error getting current track: {e}")
            return None

    # ------------------------------------------------------------------
    # Playback Controls
    # ------------------------------------------------------------------

    def play(self, uris: Optional[List[str]] = None, device_id: Optional[str] = None) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.start_playback(device_id=device_id, uris=uris)
            logger.info(f"▶️ Play — uris={uris}")
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Play error: {e}")
            return False

    def pause(self) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.pause_playback()
            logger.info("⏸️ Paused")
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Pause error: {e}")
            return False

    def resume(self) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.start_playback()
            logger.info("▶️ Resumed")
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Resume error: {e}")
            return False

    def next_track(self) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.next_track()
            logger.info("⏭️ Next track")
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Next track error: {e}")
            return False

    def previous_track(self) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.previous_track()
            logger.info("⏮️ Previous track")
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Previous track error: {e}")
            return False

    def set_volume(self, volume_percent: int) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            volume_percent = max(0, min(100, volume_percent))
            sp.volume(volume_percent)
            logger.info(f"🔊 Volume set to {volume_percent}%")
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Volume error: {e}")
            return False

    def adjust_volume(self, delta: int) -> bool:
        """Increase or decrease volume by delta (positive or negative)."""
        state = self.get_playback_state()
        if state and state.device and state.device.volume_percent is not None:
            new_vol = state.device.volume_percent + delta
            return self.set_volume(new_vol)
        return self.set_volume(50 + delta)

    def seek(self, position_ms: int) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.seek_track(position_ms)
            return True
        except spotipy.SpotifyException as e:
            logger.error(f"Seek error: {e}")
            return False

    def toggle_shuffle(self, state: bool) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.shuffle(state)
            return True
        except Exception as e:
            logger.error(f"Shuffle error: {e}")
            return False

    def set_repeat(self, state: str) -> bool:
        """state: off | track | context"""
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.repeat(state)
            return True
        except Exception as e:
            logger.error(f"Repeat error: {e}")
            return False

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query: str, search_type: str = "track", limit: int = 10) -> SearchResult:
        sp = self._sp()
        if not sp:
            return SearchResult()
        try:
            results = sp.search(q=query, type=search_type, limit=limit)
            result = SearchResult()

            if "tracks" in results:
                result.tracks = [
                    t for item in results["tracks"]["items"]
                    if (t := _parse_track(item)) is not None
                ]
            if "artists" in results:
                result.artists = results["artists"]["items"]
            if "albums" in results:
                result.albums = results["albums"]["items"]
            if "playlists" in results:
                result.playlists = results["playlists"]["items"]

            return result
        except spotipy.SpotifyException as e:
            logger.error(f"Search error: {e}")
            return SearchResult()

    # ------------------------------------------------------------------
    # Smart Play (search + play)
    # ------------------------------------------------------------------

    def play_song(self, query: str) -> tuple[bool, str]:
        """Search for a song and play the top result."""
        results = self.search(query, "track", limit=1)
        if results.tracks:
            track = results.tracks[0]
            success = self.play(uris=[track.uri])
            msg = f"Playing {track.name} by {track.artists[0].name}"
            return success, msg
        return False, f"No results found for '{query}'"

    def play_artist(self, query: str) -> tuple[bool, str]:
        """Search for an artist and play their top tracks."""
        sp = self._sp()
        if not sp:
            return False, "Not authenticated"

        results = self.search(query, "artist", limit=1)
        if results.artists:
            artist = results.artists[0]
            try:
                top_tracks = sp.artist_top_tracks(artist["id"])
                uris = [t["uri"] for t in top_tracks["tracks"][:10]]
                if uris:
                    success = self.play(uris=uris)
                    return success, f"Playing top tracks by {artist['name']}"
            except Exception as e:
                logger.error(f"Artist play error: {e}")
        return False, f"Artist '{query}' not found"

    def play_album(self, query: str) -> tuple[bool, str]:
        """Search for an album and play it."""
        results = self.search(query, "album", limit=1)
        if results.albums:
            album = results.albums[0]
            try:
                sp = self._sp()
                success = self.play(uris=[album["uri"]])
                return success, f"Playing album {album['name']}"
            except Exception as e:
                logger.error(f"Album play error: {e}")
        return False, f"Album '{query}' not found"

    def play_playlist(self, query: str) -> tuple[bool, str]:
        """Search for a playlist and play it."""
        results = self.search(query, "playlist", limit=1)
        if results.playlists:
            playlist = results.playlists[0]
            try:
                sp = self._sp()
                sp.start_playback(context_uri=playlist["uri"])
                return True, f"Playing playlist {playlist['name']}"
            except Exception as e:
                logger.error(f"Playlist play error: {e}")
        return False, f"Playlist '{query}' not found"

    # ------------------------------------------------------------------
    # Devices
    # ------------------------------------------------------------------

    def get_devices(self) -> List[PlaybackDevice]:
        sp = self._sp()
        if not sp:
            return []
        try:
            data = sp.devices()
            return [_parse_device(d) for d in data.get("devices", [])]
        except Exception as e:
            logger.error(f"Get devices error: {e}")
            return []

    def transfer_playback(self, device_id: str) -> bool:
        sp = self._sp()
        if not sp:
            return False
        try:
            sp.transfer_playback(device_id, force_play=True)
            return True
        except Exception as e:
            logger.error(f"Transfer playback error: {e}")
            return False

    # ------------------------------------------------------------------
    # User Library
    # ------------------------------------------------------------------

    def get_user_playlists(self, limit: int = 20) -> List[dict]:
        sp = self._sp()
        if not sp:
            return []
        try:
            data = sp.current_user_playlists(limit=limit)
            return data.get("items", [])
        except Exception as e:
            logger.error(f"Get playlists error: {e}")
            return []


# Singleton
_spotify_service: Optional[SpotifyService] = None


def get_spotify_service() -> SpotifyService:
    global _spotify_service
    if _spotify_service is None:
        _spotify_service = SpotifyService()
    return _spotify_service
