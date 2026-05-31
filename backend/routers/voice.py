"""
OMEGA — Voice Router
Voice command processing, transcription, and WebSocket for real-time updates.
"""

from __future__ import annotations
import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import JSONResponse

from models.schemas import VoiceCommandRequest, VoiceCommandResponse, ParsedIntent, WSMessage
from services.auth_service import get_auth_service
from services.intent_service import parse_intent, format_response_text
from services.spotify_service import get_spotify_service
from services.voice_service import get_voice_service

logger = logging.getLogger("omega.voice")
router = APIRouter()

# In-memory command history (last 50 commands)
_command_history: List[dict] = []


# ---------------------------------------------------------------------------
# WebSocket Connection Manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info(f"WS connected. Active: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
        logger.info(f"WS disconnected. Active: {len(self.active)}")

    async def broadcast(self, message: dict):
        disconnected = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Command Executor
# ---------------------------------------------------------------------------

async def execute_intent(intent: ParsedIntent) -> tuple[bool, str]:
    """Execute a parsed intent against the Spotify service."""
    sp = get_spotify_service()
    extra = ""

    try:
        if intent.intent == "play_song":
            return sp.play_song(intent.query or "")
        elif intent.intent == "play_artist":
            return sp.play_artist(intent.query or "")
        elif intent.intent == "play_album":
            return sp.play_album(intent.query or "")
        elif intent.intent == "play_playlist":
            return sp.play_playlist(intent.query or "")
        elif intent.intent == "pause":
            return sp.pause(), "Paused."
        elif intent.intent == "resume":
            return sp.resume(), "Resuming."
        elif intent.intent == "next":
            return sp.next_track(), "Next track."
        elif intent.intent == "previous":
            return sp.previous_track(), "Previous track."
        elif intent.intent == "volume_up":
            return sp.adjust_volume(+10), "Volume increased."
        elif intent.intent == "volume_down":
            return sp.adjust_volume(-10), "Volume decreased."
        elif intent.intent == "set_volume" and intent.volume is not None:
            return sp.set_volume(intent.volume), f"Volume set to {intent.volume}%."
        elif intent.intent == "mute":
            return sp.set_volume(0), "Muted."
        elif intent.intent == "shuffle_on":
            return sp.toggle_shuffle(True), "Shuffle on."
        elif intent.intent == "shuffle_off":
            return sp.toggle_shuffle(False), "Shuffle off."
        elif intent.intent == "repeat_on":
            return sp.set_repeat("track"), "Repeat on."
        elif intent.intent == "repeat_off":
            return sp.set_repeat("off"), "Repeat off."
        elif intent.intent == "now_playing":
            track = sp.get_current_track()
            if track:
                msg = f"Now playing {track.name} by {track.artists[0].name}."
                return True, msg
            return False, "Nothing is playing."
        elif intent.intent == "get_devices":
            devices = sp.get_devices()
            names = ", ".join(d.name for d in devices) if devices else "none"
            return True, f"Available devices: {names}."
        else:
            return False, f"Unknown intent: {intent.intent}"
    except Exception as e:
        logger.error(f"Intent execution error: {e}")
        return False, str(e)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/command", response_model=VoiceCommandResponse)
async def process_voice_command(request: VoiceCommandRequest):
    """
    Process a voice command from audio or text.
    Accepts either base64 audio or raw text (for testing/frontend text input).
    """
    auth = get_auth_service()
    if not auth.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")

    voice = get_voice_service()
    transcribed_text: str | None = None

    # 1. Transcribe if audio provided
    if request.audio_base64:
        transcribed_text = voice.transcribe_base64(request.audio_base64)
        if not transcribed_text:
            return VoiceCommandResponse(
                success=False,
                response_text="I couldn't understand the audio. Please try again.",
                error="transcription_failed",
            )
    elif request.text:
        transcribed_text = request.text
    else:
        raise HTTPException(status_code=400, detail="Provide audio_base64 or text")

    # 2. Parse intent
    intent = parse_intent(transcribed_text)
    logger.info(f"Command: '{transcribed_text}' → {intent.intent}")

    # 3. Execute intent
    success, action_msg = await execute_intent(intent)

    # 4. Build response text
    response_text = format_response_text(intent, success, action_msg)

    # 5. TTS
    voice.speak(response_text)

    # 6. Store in history
    history_item = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "raw_text": transcribed_text,
        "intent": intent.intent,
        "query": intent.query,
        "success": success,
        "response_text": response_text,
    }
    _command_history.insert(0, history_item)
    if len(_command_history) > 50:
        _command_history.pop()

    # 7. Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "command_result",
        "data": history_item,
    })

    return VoiceCommandResponse(
        success=success,
        transcribed_text=transcribed_text,
        intent=intent,
        action_result=action_msg,
        response_text=response_text,
    )


@router.post("/command/upload")
async def process_audio_upload(file: UploadFile = File(...)):
    """Process an uploaded audio file as a voice command."""
    import tempfile, os

    auth = get_auth_service()
    if not auth.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated")

    voice = get_voice_service()

    # Save to temp file
    suffix = ".wav" if file.filename and file.filename.endswith(".wav") else ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        transcribed_text = voice.transcribe_file(tmp_path)
    finally:
        os.unlink(tmp_path)

    if not transcribed_text:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    # Re-use the text command flow
    req = VoiceCommandRequest(text=transcribed_text)
    return await process_voice_command(req)


@router.get("/history")
async def get_command_history(limit: int = 20):
    """Return recent command history."""
    return {"history": _command_history[:limit]}


@router.get("/status")
async def voice_status():
    """Get voice service status."""
    voice = get_voice_service()
    return {
        "listening": voice.is_listening,
        "wake_word_active": voice.is_wake_word_active,
        "whisper_available": voice.whisper_available,
        "tts_available": voice.tts_available,
        "wake_word": "omega",
    }


@router.post("/tts")
async def text_to_speech(text: str):
    """Speak a text string (for testing)."""
    voice = get_voice_service()
    voice.speak(text)
    return {"status": "speaking", "text": text}


# ---------------------------------------------------------------------------
# WebSocket — Real-time playback + status updates
# ---------------------------------------------------------------------------

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket for real-time updates:
    - playback_update: current track / playback state
    - voice_status: listening indicator
    - command_result: newly executed command
    """
    await manager.connect(websocket)
    try:
        # Send initial state
        sp = get_spotify_service()
        voice = get_voice_service()

        while True:
            # Poll for playback updates every 2 seconds
            try:
                state = sp.get_playback_state()
                if state:
                    await websocket.send_json({
                        "type": "playback_update",
                        "data": state.model_dump(),
                    })

                await websocket.send_json({
                    "type": "voice_status",
                    "data": {
                        "listening": voice.is_listening,
                        "wake_word_active": voice.is_wake_word_active,
                    },
                })
            except Exception as e:
                logger.debug(f"WS poll error: {e}")

            await asyncio.sleep(2)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
