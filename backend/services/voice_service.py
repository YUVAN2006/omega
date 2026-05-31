"""
OMEGA — Voice Service
Optimized STT with ffmpeg conversion + tuned Whisper settings for voice commands.
"""

from __future__ import annotations
import base64
import logging
import os
import subprocess
import tempfile
import threading
import time
from typing import Optional, Callable

import numpy as np

logger = logging.getLogger("omega.voice")

WAKE_WORD = "omega"
SAMPLE_RATE = 16000
CHUNK_DURATION = 0.5
SILENCE_THRESHOLD = 0.01
WAKE_WORD_TIMEOUT = 8

# Common Whisper mishearing corrections for music commands
TRANSCRIPTION_FIXES = {
    # wake word variants
    "omega,": "omega",
    "o mega": "omega",
    "omaga": "omega",
    "omego": "omega",
    # command words
    "pley": "play",
    "pleay": "play",
    "pau": "pause",
    "pasue": "pause",
    "resum": "resume",
    "rezume": "resume",
    "skip this": "skip",
    "nex": "next",
    "pervious": "previous",
    "privious": "previous",
    "volum": "volume",
    "vollume": "volume",
    "lower the": "volume down",
    "louder": "volume up",
    "muted": "mute",
}


def _apply_fixes(text: str) -> str:
    """Apply known transcription correction map."""
    lower = text.lower()
    for wrong, right in TRANSCRIPTION_FIXES.items():
        lower = lower.replace(wrong, right)
    return lower


class VoiceService:
    def __init__(self):
        self.whisper_model = None
        self.tts_engine = None
        self._listening = False
        self._wake_word_active = False
        self._on_command_callback: Optional[Callable] = None
        self._lock = threading.Lock()

        self._init_whisper()
        self._init_tts()

    # ------------------------------------------------------------------
    # Initialization
    # ------------------------------------------------------------------

    def _init_whisper(self):
        try:
            from faster_whisper import WhisperModel
            from utils.helpers import load_env_settings
            settings = load_env_settings()
            model_size = settings.WHISPER_MODEL or "base"
            logger.info(f"Loading Whisper model: {model_size}")
            self.whisper_model = WhisperModel(
                model_size,
                device="cpu",
                compute_type="int8",
            )
            logger.info("✅ Whisper model loaded")
        except Exception as e:
            logger.error(f"Failed to load Whisper: {e}")
            self.whisper_model = None

    def _init_tts(self):
        try:
            import pyttsx3
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty("rate", 175)
            self.tts_engine.setProperty("volume", 0.9)
            voices = self.tts_engine.getProperty("voices")
            for voice in voices:
                name = voice.name.lower() if voice.name else ""
                if any(kw in name for kw in ["david", "mark", "daniel", "zira"]):
                    self.tts_engine.setProperty("voice", voice.id)
                    break
            logger.info("✅ TTS engine initialized")
        except Exception as e:
            logger.error(f"Failed to initialize TTS: {e}")
            self.tts_engine = None

    # ------------------------------------------------------------------
    # Core Whisper transcription (shared settings)
    # ------------------------------------------------------------------

    def _run_whisper(self, source) -> Optional[str]:
        """
        Run Whisper with settings tuned for short voice commands.
        source: file path (str) or numpy float32 array
        """
        if not self.whisper_model:
            return None
        try:
            # initial_prompt primes Whisper with music-domain vocabulary
            # so it's far less likely to mishear "play", "pause", "skip" etc.
            initial_prompt = (
                "Omega play pause resume skip next previous volume up down "
                "mute shuffle repeat playlist album artist song track"
            )

            segments, info = self.whisper_model.transcribe(
                source,
                language="en",
                beam_size=5,
                best_of=5,
                temperature=0.0,          # greedy — most deterministic
                condition_on_previous_text=False,  # each command is independent
                vad_filter=True,
                vad_parameters={
                    "min_silence_duration_ms": 300,
                    "speech_pad_ms": 200,
                    "threshold": 0.4,      # lower = picks up quieter speech
                },
                initial_prompt=initial_prompt,
                word_timestamps=False,
                no_speech_threshold=0.5,  # discard if Whisper is unsure there's speech
                log_prob_threshold=-1.0,
                compression_ratio_threshold=2.4,
            )

            raw = " ".join(seg.text for seg in segments).strip()

            # Strip common Whisper hallucinations on silence
            hallucinations = {
                "thank you", "thanks for watching", "thanks for listening",
                "you", ".", "", "...", "subscribe", "bye",
            }
            if raw.lower().strip(".! ") in hallucinations:
                logger.debug(f"Discarded hallucination: '{raw}'")
                return None

            corrected = _apply_fixes(raw)
            if corrected != raw:
                logger.info(f"Corrected: '{raw}' → '{corrected}'")

            logger.info(f"🎙️ Transcribed: '{corrected}'")
            return corrected if corrected else None

        except Exception as e:
            logger.error(f"Whisper error: {e}")
            return None

    # ------------------------------------------------------------------
    # Public transcription methods
    # ------------------------------------------------------------------

    def transcribe_audio_bytes(self, audio_bytes: bytes) -> Optional[str]:
        """Transcribe raw PCM 16kHz mono bytes."""
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        return self._run_whisper(audio_array)

    def transcribe_base64(self, audio_base64: str) -> Optional[str]:
        """
        Transcribe base64-encoded browser audio.
        Browser records WebM/Opus — convert to 16kHz WAV via ffmpeg first.
        """
        tmp_in_path = None
        tmp_out_path = None
        try:
            audio_bytes = base64.b64decode(audio_base64)

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
                tmp_in.write(audio_bytes)
                tmp_in_path = tmp_in.name

            tmp_out_path = tmp_in_path.replace(".webm", ".wav")

            # ffmpeg: convert to 16kHz mono WAV, apply gentle noise reduction
            result = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", tmp_in_path,
                    "-ar", "16000",
                    "-ac", "1",
                    # Highpass filter removes low-frequency rumble
                    # Loudnorm normalises volume so quiet recordings still work
                    "-af", "highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-f", "wav",
                    tmp_out_path,
                ],
                capture_output=True,
                timeout=20,
            )

            if result.returncode != 0:
                logger.error(f"ffmpeg failed: {result.stderr.decode()}")
                # Fallback: try without audio filters
                result2 = subprocess.run(
                    ["ffmpeg", "-y", "-i", tmp_in_path,
                     "-ar", "16000", "-ac", "1", "-f", "wav", tmp_out_path],
                    capture_output=True, timeout=15,
                )
                if result2.returncode != 0:
                    return None

            return self.transcribe_file(tmp_out_path)

        except FileNotFoundError:
            logger.error("ffmpeg not found — install it and add to PATH")
            return None
        except Exception as e:
            logger.error(f"Base64 transcription error: {e}")
            return None
        finally:
            for path in [tmp_in_path, tmp_out_path]:
                try:
                    if path and os.path.exists(path):
                        os.unlink(path)
                except Exception:
                    pass

    def transcribe_file(self, file_path: str) -> Optional[str]:
        """Transcribe an audio file (WAV/MP3/etc)."""
        if not self.whisper_model:
            return None
        return self._run_whisper(file_path)

    # ------------------------------------------------------------------
    # Text-to-Speech
    # ------------------------------------------------------------------

    def speak(self, text: str):
        if not self.tts_engine or not text:
            return

        def _speak():
            try:
                with self._lock:
                    self.tts_engine.say(text)
                    self.tts_engine.runAndWait()
            except Exception as e:
                logger.error(f"TTS error: {e}")

        threading.Thread(target=_speak, daemon=True).start()

    # ------------------------------------------------------------------
    # Wake Word
    # ------------------------------------------------------------------

    def contains_wake_word(self, text: str) -> bool:
        return WAKE_WORD.lower() in text.lower()

    def strip_wake_word(self, text: str) -> str:
        import re
        pattern = rf"\b{re.escape(WAKE_WORD)}\b[,\s]*"
        return re.sub(pattern, "", text, flags=re.IGNORECASE).strip()

    def start_listening(self, on_command: Callable[[str], None]):
        self._on_command_callback = on_command
        self._listening = True
        threading.Thread(target=self._listen_loop, daemon=True).start()
        logger.info(f"Listening for wake word: '{WAKE_WORD}'")

    def stop_listening(self):
        self._listening = False

    def _listen_loop(self):
        try:
            import sounddevice as sd
            chunk_samples = int(SAMPLE_RATE * CHUNK_DURATION)
            buffer = []
            wake_timer = None

            while self._listening:
                chunk = sd.rec(chunk_samples, samplerate=SAMPLE_RATE,
                               channels=1, dtype="int16", blocking=True)
                rms = float(np.sqrt(np.mean(chunk.astype(np.float32) ** 2)))

                if rms < SILENCE_THRESHOLD * 32768:
                    if self._wake_word_active and wake_timer and (time.time() - wake_timer) > WAKE_WORD_TIMEOUT:
                        self._wake_word_active = False
                        buffer = []
                    continue

                buffer.append(chunk)

                if len(buffer) >= int(2 / CHUNK_DURATION):
                    audio_data = np.concatenate(buffer, axis=0).flatten()
                    text = self.transcribe_audio_bytes(audio_data.tobytes())
                    buffer = []

                    if text:
                        if not self._wake_word_active and self.contains_wake_word(text):
                            self._wake_word_active = True
                            wake_timer = time.time()
                            command_part = self.strip_wake_word(text)
                            if command_part and len(command_part) > 3:
                                if self._on_command_callback:
                                    self._on_command_callback(command_part)
                                self._wake_word_active = False
                        elif self._wake_word_active:
                            if self._on_command_callback:
                                self._on_command_callback(text)
                            self._wake_word_active = False

        except Exception as e:
            logger.error(f"Listen loop error: {e}")
            self._listening = False

    # ------------------------------------------------------------------
    # Properties / cleanup
    # ------------------------------------------------------------------

    @property
    def is_listening(self) -> bool:
        return self._listening

    @property
    def is_wake_word_active(self) -> bool:
        return self._wake_word_active

    @property
    def whisper_available(self) -> bool:
        return self.whisper_model is not None

    @property
    def tts_available(self) -> bool:
        return self.tts_engine is not None

    def cleanup(self):
        self.stop_listening()
        if self.tts_engine:
            try:
                self.tts_engine.stop()
            except Exception:
                pass


_voice_service: Optional[VoiceService] = None


def get_voice_service() -> VoiceService:
    global _voice_service
    if _voice_service is None:
        _voice_service = VoiceService()
    return _voice_service
