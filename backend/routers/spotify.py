"""
OMEGA — Spotify Router
All Spotify playback and search endpoints.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from services.spotify_service import get_spotify_service
from services.auth_service import get_auth_service
from models.schemas import (
    PlaybackState, Track, SearchResult, PlayRequest,
    VolumeRequest, SeekRequest, SearchRequest,
)
import logging

logger = logging.getLogger("omega.spotify")
router = APIRouter()


def _require_auth():
    auth = get_auth_service()
    if not auth.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")


# ------------------------------------------------------------------
# Playback State
# ------------------------------------------------------------------

@router.get("/playback", response_model=Optional[PlaybackState])
async def get_playback():
    """Get current playback state."""
    _require_auth()
    sp = get_spotify_service()
    return sp.get_playback_state()


@router.get("/track", response_model=Optional[Track])
async def get_current_track():
    """Get currently playing track."""
    _require_auth()
    sp = get_spotify_service()
    return sp.get_current_track()


# ------------------------------------------------------------------
# Controls
# ------------------------------------------------------------------

@router.post("/play")
async def play(request: PlayRequest):
    """Play a URI or resume playback."""
    _require_auth()
    sp = get_spotify_service()

    uris = [request.uri] if request.uri else None
    success = sp.play(uris=uris, device_id=request.device_id)

    if not success:
        raise HTTPException(status_code=400, detail="Playback failed — check active device")
    return {"status": "playing"}


@router.post("/pause")
async def pause():
    """Pause playback."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.pause():
        raise HTTPException(status_code=400, detail="Pause failed")
    return {"status": "paused"}


@router.post("/resume")
async def resume():
    """Resume playback."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.resume():
        raise HTTPException(status_code=400, detail="Resume failed")
    return {"status": "resumed"}


@router.post("/next")
async def next_track():
    """Skip to next track."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.next_track():
        raise HTTPException(status_code=400, detail="Skip failed")
    return {"status": "skipped"}


@router.post("/previous")
async def previous_track():
    """Go to previous track."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.previous_track():
        raise HTTPException(status_code=400, detail="Previous failed")
    return {"status": "previous"}


@router.post("/volume")
async def set_volume(request: VolumeRequest):
    """Set playback volume."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.set_volume(request.volume_percent):
        raise HTTPException(status_code=400, detail="Volume control failed")
    return {"status": "ok", "volume": request.volume_percent}


@router.post("/seek")
async def seek(request: SeekRequest):
    """Seek to position in track."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.seek(request.position_ms):
        raise HTTPException(status_code=400, detail="Seek failed")
    return {"status": "ok", "position_ms": request.position_ms}


@router.post("/shuffle/{state}")
async def toggle_shuffle(state: bool):
    """Toggle shuffle mode."""
    _require_auth()
    sp = get_spotify_service()
    sp.toggle_shuffle(state)
    return {"shuffle": state}


@router.post("/repeat/{state}")
async def set_repeat(state: str):
    """Set repeat mode: off | track | context."""
    if state not in ("off", "track", "context"):
        raise HTTPException(status_code=400, detail="Invalid repeat state")
    _require_auth()
    sp = get_spotify_service()
    sp.set_repeat(state)
    return {"repeat": state}


# ------------------------------------------------------------------
# Search
# ------------------------------------------------------------------

@router.get("/search", response_model=SearchResult)
async def search(
    q: str = Query(..., description="Search query"),
    type: str = Query(default="track", description="track | artist | album | playlist"),
    limit: int = Query(default=10, ge=1, le=50),
):
    """Search Spotify catalog."""
    _require_auth()
    sp = get_spotify_service()
    return sp.search(q, type, limit)


# ------------------------------------------------------------------
# Smart Play endpoints
# ------------------------------------------------------------------

@router.post("/play/song")
async def play_song(request: PlayRequest):
    """Search and play a song by name."""
    _require_auth()
    if not request.query:
        raise HTTPException(status_code=400, detail="query required")
    sp = get_spotify_service()
    success, message = sp.play_song(request.query)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"status": "playing", "message": message}


@router.post("/play/artist")
async def play_artist(request: PlayRequest):
    """Search and play top tracks of an artist."""
    _require_auth()
    if not request.query:
        raise HTTPException(status_code=400, detail="query required")
    sp = get_spotify_service()
    success, message = sp.play_artist(request.query)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"status": "playing", "message": message}


@router.post("/play/album")
async def play_album(request: PlayRequest):
    """Search and play an album."""
    _require_auth()
    if not request.query:
        raise HTTPException(status_code=400, detail="query required")
    sp = get_spotify_service()
    success, message = sp.play_album(request.query)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"status": "playing", "message": message}


@router.post("/play/playlist")
async def play_playlist(request: PlayRequest):
    """Search and play a playlist."""
    _require_auth()
    if not request.query:
        raise HTTPException(status_code=400, detail="query required")
    sp = get_spotify_service()
    success, message = sp.play_playlist(request.query)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"status": "playing", "message": message}


# ------------------------------------------------------------------
# Devices
# ------------------------------------------------------------------

@router.get("/devices")
async def get_devices():
    """Get available playback devices."""
    _require_auth()
    sp = get_spotify_service()
    devices = sp.get_devices()
    return {"devices": [d.model_dump() for d in devices]}


@router.post("/devices/{device_id}/transfer")
async def transfer_playback(device_id: str):
    """Transfer playback to a different device."""
    _require_auth()
    sp = get_spotify_service()
    if not sp.transfer_playback(device_id):
        raise HTTPException(status_code=400, detail="Transfer failed")
    return {"status": "transferred"}


# ------------------------------------------------------------------
# User Library
# ------------------------------------------------------------------

@router.get("/playlists")
async def get_user_playlists(limit: int = Query(default=20, ge=1, le=50)):
    """Get current user's playlists."""
    _require_auth()
    sp = get_spotify_service()
    playlists = sp.get_user_playlists(limit)
    return {"playlists": playlists}
