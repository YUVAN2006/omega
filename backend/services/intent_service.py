"""
OMEGA — Intent Service
Optimized natural language → structured command mapping.
More patterns, fuzzy fallback, and better query extraction.
"""

from __future__ import annotations
import re
import logging
from typing import Optional

from models.schemas import ParsedIntent
from utils.helpers import sanitize_query, extract_volume_from_text

logger = logging.getLogger("omega.intent")


# ---------------------------------------------------------------------------
# Preprocessing — normalise before matching
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _remove_wake_word(text: str) -> str:
    """Strip 'omega' and common filler from the start."""
    fillers = [
        r"^omega\s*[,.]?\s*",
        r"^hey omega\s*[,.]?\s*",
        r"^ok omega\s*[,.]?\s*",
        r"^(please|can you|could you|would you|i want you to)\s+",
    ]
    for f in fillers:
        text = re.sub(f, "", text, flags=re.IGNORECASE).strip()
    return text


# ---------------------------------------------------------------------------
# Intent patterns — ordered: specific first, generic last
# ---------------------------------------------------------------------------

INTENT_PATTERNS: list[tuple[str, list[str]]] = [

    # ── Playback controls ────────────────────────────────────────────
    ("pause", [
        r"\bpause\b",
        r"\bstop( the)? (music|song|track|playback)\b",
        r"\bstop playing\b",
        r"\bhold on\b",
        r"\bwait\b",
    ]),
    ("resume", [
        r"\bresume\b",
        r"\bcontinue\b",
        r"\bunpause\b",
        r"\bplay again\b",
        r"\bstart( the music| playing)?\s*$",  # "start" with nothing after
        r"\bkeep playing\b",
    ]),
    ("next", [
        r"\bnext( song| track| one)?\b",
        r"\bskip( this| song| track)?\b",
        r"\bforward\b",
        r"\bchange( the)? song\b",
        r"\bi don.?t (like|want) this\b",
    ]),
    ("previous", [
        r"\bprevious( song| track)?\b",
        r"\bgo back\b",
        r"\blast( song| track)?\b",
        r"\bback( up)?\b",
        r"\brewind\b",
    ]),

    # ── Volume ───────────────────────────────────────────────────────
    ("volume_up", [
        r"\bvolume up\b",
        r"\bincrease (the )?volume\b",
        r"\bturn (it |the )?(volume |music )?up\b",
        r"\bloude?r\b",
        r"\bmore volume\b",
        r"\bcan.?t hear\b",
        r"\btoo quiet\b",
    ]),
    ("volume_down", [
        r"\bvolume down\b",
        r"\bdecrease (the )?volume\b",
        r"\bturn (it |the )?(volume |music )?down\b",
        r"\bquieter\b",
        r"\bsofter\b",
        r"\btoo loud\b",
        r"\blower (the )?volume\b",
    ]),
    ("set_volume", [
        r"\bset (the )?volume (to |at )?\d+\b",
        r"\bvolume (to |at )?\d+\b",
        r"\b\d+\s*percent( volume)?\b",
        r"\bvolume \d+\b",
    ]),
    ("mute", [
        r"\bmute\b",
        r"\bsilence\b",
        r"\bturn off (the )?(sound|music|volume)\b",
        r"\bquiet\b",
        r"\bno sound\b",
        r"\bshut (up|it)\b",
    ]),

    # ── Shuffle / Repeat ─────────────────────────────────────────────
    ("shuffle_on", [
        r"\bshuffle( on| mode)?\b",
        r"\bturn on shuffle\b",
        r"\benable shuffle\b",
        r"\brandom(ize|ly)?\b",
        r"\bmix (it |things )?up\b",
    ]),
    ("shuffle_off", [
        r"\bshuffle off\b",
        r"\bturn off shuffle\b",
        r"\bdisable shuffle\b",
        r"\bno shuffle\b",
        r"\bstop shuffling\b",
    ]),
    ("repeat_on", [
        r"\brepeat( on| mode)?\b",
        r"\bturn on repeat\b",
        r"\bloop( this| song| track)?\b",
        r"\bplay (this |it )?again( and again)?\b",
        r"\bon repeat\b",
    ]),
    ("repeat_off", [
        r"\brepeat off\b",
        r"\bturn off repeat\b",
        r"\bstop (repeating|looping)\b",
        r"\bno repeat\b",
        r"\bdon.?t repeat\b",
    ]),

    # ── Now playing ──────────────────────────────────────────────────
    ("now_playing", [
        r"\bwhat.?s (playing|this|on)\b",
        r"\bwhat (song|track|music) is (this|playing)\b",
        r"\bwho (is|are) (this|singing|playing)\b",
        r"\bname (of |this )(song|track|music)\b",
        r"\btell me (what.?s playing|the song)\b",
        r"\bwhat (am i|are we) listening to\b",
        r"\bidentify (this|the) (song|track|music)\b",
    ]),

    # ── Contextual play (must come BEFORE generic play_song) ─────────
    ("play_playlist", [
        r"\bplay\b.{0,40}\bplaylist\b",
        r"\bplaylist\b.{0,40}\bplay\b",
        r"\bput on\b.{0,40}\bplaylist\b",
        r"\bstart\b.{0,40}\bplaylist\b",
        r"\bopen\b.{0,40}\bplaylist\b",
        r"\bmy playlist\b",
        r"\bqueue\b.{0,30}\bplaylist\b",
    ]),
    ("play_album", [
        r"\bplay\b.{0,40}\balbum\b",
        r"\balbum\b.{0,40}\bplay\b",
        r"\bput on\b.{0,40}\balbum\b",
        r"\bstart\b.{0,40}\balbum\b",
        r"\bplay (the )?album\b",
        r"\blisten to (the )?album\b",
    ]),
    ("play_artist", [
        r"\bplay\b.{0,30}\b(songs?|music|tracks?|stuff)\s+by\b",
        r"\bplay\b.{0,15}\bby\b",
        r"\bput on\b.{0,20}\b(songs?|music)\s+by\b",
        r"\b(songs?|music|tracks?)\s+by\b.{0,30}\bplay\b",
        r"\bplay (some |any )?\w+ (music|songs?)\b",
        r"\bi (want|like) (some )?\w+\b.{0,10}\bmusic\b",
        r"\bplay (some )?music by\b",
        r"\bartist\b.{0,30}\bplay\b",
    ]),

    # ── Generic play (last resort) ───────────────────────────────────
    ("play_song", [
        r"\bplay\b",
        r"\bput on\b",
        r"\bi (want|wanna) (to )?(hear|listen to)\b",
        r"\bcan (you |u )?(play|put on)\b",
        r"\bplease (play|put on)\b",
        r"\blet me hear\b",
        r"\bstart playing\b",
        r"\bqueue\b",
    ]),

    # ── Devices ──────────────────────────────────────────────────────
    ("get_devices", [
        r"\b(show|list|what|find) (my )?(devices?|speakers?|outputs?)\b",
        r"\bwhere is (the )?music (playing|coming from)\b",
        r"\bswitch (device|speaker|output)\b",
    ]),

    # ── Like ─────────────────────────────────────────────────────────
    ("like_song", [
        r"\b(like|love|save|heart) (this|the) (song|track)\b",
        r"\badd (this|the) (song|track) to (my )?(library|liked|favorites?)\b",
        r"\bi (like|love) (this|it)\b",
    ]),
]


# ---------------------------------------------------------------------------
# Query extraction
# ---------------------------------------------------------------------------

# Patterns to strip from the front of text to get the search query
_STRIP_FRONT: dict[str, list[str]] = {
    "play_song": [
        r"^(please |can you |could you |omega,? )?(play|put on|queue)\s+",
        r"^i (want|wanna) (to )?(hear|listen to)\s+",
        r"^let me hear\s+",
        r"^start playing\s+",
    ],
    "play_artist": [
        r"^(please |can you |)?(play|put on)\s+(some |any )?(songs?|music|tracks?)\s+by\s+",
        r"^(please |can you |)?(play|put on)\s+",
        r"^i (want|like) (some )?\s*",
        r"\s+(songs?|music|tracks?|stuff)\s*$",
        r"^some\s+",
    ],
    "play_album": [
        r"^(please |can you |)?(play|put on|listen to)\s+(the\s+)?album\s+",
        r"\s+album\s*$",
        r"^(please |can you |)?(play|put on)\s+",
    ],
    "play_playlist": [
        r"^(please |can you |)?(play|put on|start|open|queue)\s+(my\s+)?playlist\s+",
        r"\s+playlist\s*$",
        r"^(please |can you |)?(play|put on)\s+",
        r"^my\s+",
    ],
}

# Words to remove from the end of extracted queries
_TRAILING_NOISE = [
    r"\s+(please|now|for me|on spotify)\s*$",
    r"\s+(song|track)\s*$",
]


def _extract_query(text: str, intent: str) -> Optional[str]:
    """Extract the search query from a play command."""
    query = text

    strips = _STRIP_FRONT.get(intent, _STRIP_FRONT["play_song"])
    for pattern in strips:
        query = re.sub(pattern, "", query, flags=re.IGNORECASE).strip()

    for pattern in _TRAILING_NOISE:
        query = re.sub(pattern, "", query, flags=re.IGNORECASE).strip()

    # Remove leftover filler
    query = re.sub(r"^(the|a|an)\s+", "", query, flags=re.IGNORECASE).strip()

    return query if len(query) >= 2 else None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_intent(text: str) -> ParsedIntent:
    """
    Parse raw voice/text into a ParsedIntent.

    Examples:
      "Play Blinding Lights"          → play_song  / "blinding lights"
      "Can you play Starboy?"         → play_song  / "starboy"
      "Play songs by The Weeknd"      → play_artist / "the weeknd"
      "Skip"                          → next
      "Turn it up"                    → volume_up
      "Set volume to 60"              → set_volume / volume=60
      "What's playing?"               → now_playing
    """
    clean = _normalize(sanitize_query(text))
    clean = _remove_wake_word(clean)

    logger.debug(f"Parsing: '{clean}'")

    for intent_name, patterns in INTENT_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, clean, re.IGNORECASE):
                query: Optional[str] = None
                volume: Optional[int] = None

                if intent_name.startswith("play_"):
                    query = _extract_query(clean, intent_name)
                elif intent_name == "set_volume":
                    volume = extract_volume_from_text(clean)

                logger.info(f"✅ Intent: {intent_name} | query={query!r} | volume={volume}")
                return ParsedIntent(
                    intent=intent_name,
                    query=query,
                    volume=volume,
                    raw_text=text,
                    confidence=0.9,
                )

    # Fallback — treat entire utterance as a song search
    logger.info(f"⚠️  No intent matched, defaulting play_song: '{clean}'")
    return ParsedIntent(
        intent="play_song",
        query=clean or text,
        raw_text=text,
        confidence=0.4,
    )


def format_response_text(intent: ParsedIntent, success: bool, extra: str = "") -> str:
    if not success:
        return extra or "Sorry, I couldn't complete that."

    q = intent.query or ""
    responses = {
        "play_song":     f"Playing {q}." if q else "Playing.",
        "play_artist":   f"Playing music by {q}." if q else "Playing artist.",
        "play_album":    f"Playing the album {q}." if q else "Playing album.",
        "play_playlist": f"Starting playlist {q}." if q else "Starting playlist.",
        "pause":         "Paused.",
        "resume":        "Resuming.",
        "next":          "Next track.",
        "previous":      "Going back.",
        "volume_up":     "Volume up.",
        "volume_down":   "Volume down.",
        "set_volume":    f"Volume set to {intent.volume}%." if intent.volume is not None else "Volume adjusted.",
        "mute":          "Muted.",
        "shuffle_on":    "Shuffle on.",
        "shuffle_off":   "Shuffle off.",
        "repeat_on":     "Repeat on.",
        "repeat_off":    "Repeat off.",
        "now_playing":   extra or "Checking current track.",
        "like_song":     "Added to liked songs.",
        "get_devices":   extra or "Here are your devices.",
    }
    return responses.get(intent.intent, extra or "Done.")
