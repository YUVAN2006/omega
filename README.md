# OMEGA — AI Voice Assistant for Spotify

> A futuristic, Jarvis-style desktop voice assistant for full Spotify control.

---

## Features

- 🎙️ **Wake word detection** — Say "Omega" to activate
- 🧠 **AI Intent Engine** — Natural language → structured Spotify commands
- 🎵 **Full Spotify Control** — Play, pause, skip, volume, search, playlists
- 🌐 **Real-time dashboard** — Live track info, artwork, progress bar
- 🎨 **Glassmorphism UI** — Dark neon futuristic interface
- 🔐 **OAuth 2.0** — Secure Spotify authentication

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Spotify Developer Account** — [Create App](https://developer.spotify.com/dashboard)
- **Microphone** access
- **FFmpeg** (required by faster-whisper)

---

## Setup

### 1. Clone / Extract

```bash
cd omega
```

### 2. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Set Redirect URI to: `http://localhost:8000/auth/callback`
4. Note your **Client ID** and **Client Secret**

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy and fill environment variables:
```bash
cp .env.example .env
# Edit .env with your Spotify credentials
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/callback
SECRET_KEY=your_random_secret_key_here
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Voice Commands

| You say...                             | Action                    |
|----------------------------------------|---------------------------|
| "Omega, play Starboy"                  | Play track                |
| "Omega, pause"                         | Pause playback            |
| "Omega, resume"                        | Resume playback           |
| "Omega, skip"                          | Skip to next track        |
| "Omega, previous"                      | Go to previous track      |
| "Omega, volume up"                     | Increase volume by 10%    |
| "Omega, set volume to 50"              | Set volume to 50%         |
| "Omega, play songs by The Weeknd"      | Search & play artist      |
| "Omega, play my playlist Chill"        | Play named playlist       |
| "Omega, what's playing?"               | Get current track info    |

---

## Project Structure

```
omega/
├── README.md
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── dashboard/     # Main dashboard panels
│       │   ├── spotify/       # Spotify player components
│       │   ├── voice/         # Voice orb & listening UI
│       │   ├── ui/            # Shadcn + custom primitives
│       │   └── layout/        # Layout wrappers
│       ├── hooks/             # Custom React hooks
│       ├── services/          # API service layer
│       ├── store/             # Zustand state management
│       ├── types/             # TypeScript interfaces
│       └── utils/             # Helpers
└── backend/
    ├── main.py
    ├── requirements.txt
    ├── .env.example
    ├── routers/
    │   ├── auth.py
    │   ├── spotify.py
    │   └── voice.py
    ├── services/
    │   ├── spotify_service.py
    │   ├── voice_service.py
    │   ├── intent_service.py
    │   └── auth_service.py
    ├── models/
    │   └── schemas.py
    └── utils/
        └── helpers.py
```

---

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS |
| UI        | Shadcn/UI, Framer Motion           |
| State     | Zustand                            |
| Backend   | Python 3.10+, FastAPI              |
| Voice STT | faster-whisper                     |
| Voice TTS | pyttsx3                            |
| Spotify   | Spotipy, Spotify Web API           |
| Auth      | OAuth 2.0 PKCE                     |
