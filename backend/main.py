"""
OMEGA Backend — FastAPI Application
Main entry point with CORS, routing, and lifespan management.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from routers import auth, spotify, voice
from services.voice_service import VoiceService
from utils.helpers import load_env_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("omega")

settings = load_env_settings()

voice_service_instance: VoiceService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup / shutdown."""
    global voice_service_instance
    logger.info("🚀 OMEGA backend starting up...")

    voice_service_instance = VoiceService()
    app.state.voice_service = voice_service_instance

    logger.info("✅ Voice service initialized")
    yield

    logger.info("🛑 OMEGA backend shutting down...")
    if voice_service_instance:
        voice_service_instance.cleanup()


app = FastAPI(
    title="OMEGA Voice Assistant API",
    description="Futuristic AI Voice Assistant for Spotify Control",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(spotify.router, prefix="/spotify", tags=["Spotify"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "app": "OMEGA Voice Assistant",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "omega-backend"}
