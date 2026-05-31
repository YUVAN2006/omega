"""
OMEGA — Utility Helpers
Environment settings, token helpers, and shared utilities.
"""

from __future__ import annotations
import os
import secrets
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    SPOTIFY_CLIENT_ID: str = Field(default="")
    SPOTIFY_CLIENT_SECRET: str = Field(default="")
    SPOTIFY_REDIRECT_URI: str = Field(default="http://localhost:8000/auth/callback")
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    FRONTEND_URL: str = Field(default="http://localhost:5173")
    WHISPER_MODEL: str = Field(default="base")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def load_env_settings() -> Settings:
    return Settings()


def ms_to_time(ms: int) -> str:
    """Convert milliseconds to mm:ss string."""
    seconds = ms // 1000
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes}:{seconds:02d}"


def sanitize_query(text: str) -> str:
    """Remove wake word prefix and clean up voice query."""
    text = text.strip()
    # Remove wake word prefixes (case-insensitive)
    prefixes = ["omega,", "omega ", "hey omega,", "hey omega "]
    lower = text.lower()
    for prefix in prefixes:
        if lower.startswith(prefix):
            text = text[len(prefix):].strip()
            break
    return text


def extract_volume_from_text(text: str) -> int | None:
    """Extract volume percentage from text like 'set volume to 75'."""
    import re
    patterns = [
        r"(?:set\s+)?volume\s+(?:to\s+)?(\d+)",
        r"(\d+)\s+percent",
        r"(\d+)%",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            val = int(match.group(1))
            return max(0, min(100, val))
    return None
