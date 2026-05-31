"""
OMEGA — Pydantic Schemas
All request/response models for the API.
"""

from __future__ import annotations
from typing import Optional, List, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    scope: str = ""


class AuthStatusResponse(BaseModel):
    authenticated: bool
    user: Optional[SpotifyUser] = None


# ---------------------------------------------------------------------------
# Spotify User
# ---------------------------------------------------------------------------

class SpotifyUser(BaseModel):
    id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    images: Optional[List[dict]] = None
    product: Optional[str] = None  # premium / free


# ---------------------------------------------------------------------------
# Playback
# ---------------------------------------------------------------------------

class TrackArtist(BaseModel):
    id: str
    name: str


class TrackAlbum(BaseModel):
    id: str
    name: str
    images: List[dict] = []
    release_date: Optional[str] = None


class Track(BaseModel):
    id: str
    name: str
    artists: List[TrackArtist]
    album: TrackAlbum
    duration_ms: int
    explicit: bool = False
    popularity: Optional[int] = None
    uri: str
    preview_url: Optional[str] = None


class PlaybackDevice(BaseModel):
    id: Optional[str]
    name: str
    type: str
    is_active: bool
    volume_percent: Optional[int]


class PlaybackState(BaseModel):
    is_playing: bool
    track: Optional[Track] = None
    progress_ms: int = 0
    device: Optional[PlaybackDevice] = None
    shuffle_state: bool = False
    repeat_state: str = "off"  # off / track / context
    timestamp: Optional[int] = None


# ---------------------------------------------------------------------------
# Spotify Commands
# ---------------------------------------------------------------------------

class PlayRequest(BaseModel):
    query: Optional[str] = None
    uri: Optional[str] = None
    device_id: Optional[str] = None


class VolumeRequest(BaseModel):
    volume_percent: int = Field(..., ge=0, le=100)


class SeekRequest(BaseModel):
    position_ms: int = Field(..., ge=0)


class SearchRequest(BaseModel):
    query: str
    search_type: str = "track"  # track / artist / album / playlist
    limit: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    tracks: List[Track] = []
    artists: List[dict] = []
    albums: List[dict] = []
    playlists: List[dict] = []


# ---------------------------------------------------------------------------
# Voice
# ---------------------------------------------------------------------------

class VoiceCommandRequest(BaseModel):
    audio_base64: Optional[str] = None
    text: Optional[str] = None  # for text-based testing


class ParsedIntent(BaseModel):
    intent: str
    query: Optional[str] = None
    volume: Optional[int] = None
    raw_text: str
    confidence: float = 1.0


class VoiceCommandResponse(BaseModel):
    success: bool
    transcribed_text: Optional[str] = None
    intent: Optional[ParsedIntent] = None
    action_result: Optional[Any] = None
    response_text: str
    error: Optional[str] = None


class WakeWordStatus(BaseModel):
    listening: bool
    wake_word: str = "omega"


# ---------------------------------------------------------------------------
# WebSocket Messages
# ---------------------------------------------------------------------------

class WSMessage(BaseModel):
    type: str  # playback_update / voice_status / command_result / error
    data: Any


class CommandHistoryItem(BaseModel):
    id: str
    timestamp: str
    raw_text: str
    intent: str
    success: bool
    response_text: str
