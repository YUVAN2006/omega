"""
OMEGA — Auth Router
Spotify OAuth 2.0 endpoints.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from services.auth_service import get_auth_service
from models.schemas import AuthStatusResponse, SpotifyUser
import logging

logger = logging.getLogger("omega.auth")
router = APIRouter()


@router.get("/login")
async def login():
    """Redirect user to Spotify authorization page."""
    auth = get_auth_service()
    try:
        auth_url = auth.get_auth_url()
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def callback(code: str, state: str = None, error: str = None):
    """Handle Spotify OAuth callback."""
    from utils.helpers import load_env_settings
    settings = load_env_settings()

    if error:
        logger.warning(f"OAuth error returned: {error}")
        return RedirectResponse(f"{settings.FRONTEND_URL}?error={error}")

    auth = get_auth_service()
    try:
        token_info = auth.exchange_code(code)
        if not token_info:
            return RedirectResponse(f"{settings.FRONTEND_URL}?error=token_exchange_failed")
        return RedirectResponse(f"{settings.FRONTEND_URL}?auth=success")
    except Exception as e:
        logger.error(f"Callback error: {e}")
        return RedirectResponse(f"{settings.FRONTEND_URL}?error=callback_failed")


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status():
    """Check if user is authenticated."""
    auth = get_auth_service()
    authenticated = auth.is_authenticated()
    user = None

    if authenticated:
        raw_user = auth.get_user_info()
        if raw_user:
            user = SpotifyUser(
                id=raw_user.get("id", ""),
                display_name=raw_user.get("display_name"),
                email=raw_user.get("email"),
                images=raw_user.get("images", []),
                product=raw_user.get("product"),
            )

    return AuthStatusResponse(authenticated=authenticated, user=user)


@router.post("/logout")
async def logout():
    """Clear authentication tokens."""
    auth = get_auth_service()
    auth.logout()
    return {"message": "Logged out successfully"}


@router.get("/refresh")
async def refresh_token():
    """Force token refresh."""
    auth = get_auth_service()
    token = auth.get_valid_token()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated or refresh failed")
    return {"status": "refreshed"}
