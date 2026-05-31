"""
OMEGA — Auth Service
Handles Spotify OAuth 2.0 Authorization Code Flow with token management.
"""

from __future__ import annotations
import logging
import time
from typing import Optional

import spotipy
from spotipy.oauth2 import SpotifyOAuth

from utils.helpers import load_env_settings

logger = logging.getLogger("omega.auth")

SPOTIFY_SCOPES = " ".join([
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
    "streaming",
])

# In-memory token store (use Redis/DB in production)
_token_store: dict = {}


class AuthService:
    def __init__(self):
        self.settings = load_env_settings()
        self._oauth_manager: Optional[SpotifyOAuth] = None

    def _get_oauth_manager(self) -> SpotifyOAuth:
        if not self._oauth_manager:
            self._oauth_manager = SpotifyOAuth(
                client_id=self.settings.SPOTIFY_CLIENT_ID,
                client_secret=self.settings.SPOTIFY_CLIENT_SECRET,
                redirect_uri=self.settings.SPOTIFY_REDIRECT_URI,
                scope=SPOTIFY_SCOPES,
                cache_path=None,  # We manage tokens ourselves
                open_browser=False,
            )
        return self._oauth_manager

    def get_auth_url(self) -> str:
        """Generate Spotify authorization URL."""
        oauth = self._get_oauth_manager()
        auth_url = oauth.get_authorize_url()
        logger.info("Generated Spotify auth URL")
        return auth_url

    def exchange_code(self, code: str) -> dict:
        """Exchange authorization code for access token."""
        oauth = self._get_oauth_manager()
        token_info = oauth.get_access_token(code, as_dict=True, check_cache=False)
        if token_info:
            _token_store["current"] = token_info
            logger.info("✅ Token exchanged and stored")
        return token_info

    def get_valid_token(self) -> Optional[str]:
        """Return a valid access token, refreshing if necessary."""
        token_info = _token_store.get("current")
        if not token_info:
            return None

        # Check expiry with 60s buffer
        expires_at = token_info.get("expires_at", 0)
        if time.time() > expires_at - 60:
            token_info = self._refresh_token(token_info)

        return token_info.get("access_token") if token_info else None

    def _refresh_token(self, token_info: dict) -> Optional[dict]:
        """Refresh an expired access token."""
        refresh_token = token_info.get("refresh_token")
        if not refresh_token:
            logger.warning("No refresh token available")
            return None

        oauth = self._get_oauth_manager()
        try:
            new_token = oauth.refresh_access_token(refresh_token)
            if new_token:
                # Preserve refresh token if not returned
                if not new_token.get("refresh_token"):
                    new_token["refresh_token"] = refresh_token
                _token_store["current"] = new_token
                logger.info("♻️ Token refreshed successfully")
            return new_token
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            return None

    def get_spotify_client(self) -> Optional[spotipy.Spotify]:
        """Get an authenticated Spotipy client."""
        token = self.get_valid_token()
        if not token:
            return None
        return spotipy.Spotify(auth=token)

    def is_authenticated(self) -> bool:
        """Check if user is currently authenticated."""
        return self.get_valid_token() is not None

    def logout(self):
        """Clear stored tokens."""
        _token_store.clear()
        logger.info("User logged out, tokens cleared")

    def get_user_info(self) -> Optional[dict]:
        """Fetch current user profile."""
        sp = self.get_spotify_client()
        if not sp:
            return None
        try:
            return sp.current_user()
        except Exception as e:
            logger.error(f"Failed to fetch user info: {e}")
            return None


# Singleton
_auth_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service
