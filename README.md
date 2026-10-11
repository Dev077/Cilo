# Cilo

**Talk. Cilo remembers.**

Cilo is a voice-first memory app. Tap the orb, have your conversation, and Cilo turns it into a transcript, a short summary of what happened, a to-do list, and deadlines on your calendar. You don't have to type or sort anything yourself.

---

## What it does

- **Record anywhere.** A liquid droplet floats over every screen. Drag it out of the way, tap it to start recording. While you talk, it ripples with your voice and shows live captions.
- **Built-in transcription.** Speech is transcribed by the phone's own recognizer (iOS Speech / Android SpeechRecognizer). Only text reaches the Cilo backend; no audio is uploaded or stored.
- **Automatic to-dos.** Gemini reads each transcript and pulls out real commitments ("I'll send the deck by Friday"). Relative dates like "tomorrow" or "next Wednesday" become actual due dates.
- **What Happened.** Each conversation gets a 2-3 sentence summary and a name. Recordings are named for the person they're with, or for the topic when there isn't one.
- **Calendar with deadlines.** Conversations show up as sticky notes and deadlines as dots. Tap a day to see its conversations and check off what's due.
- **Search.** Ranked full-text search across names, summaries and transcripts, with the matching sentence shown for each result.
- **Time-of-day theming.** The hello page and the orb share one palette that shifts through the day: peach in the morning, rose in the afternoon, aqua in the evening, violet at night.

## How it works

```
  phone                                     backend                         storage
 ───────────────────────────────           ──────────────────────────       ─────────
  floating orb ──tap──> recorder
                          │ phone's speech recognition
                          │ (live captions, auto-restarts on silence)
                          ▼
                    transcript text ──POST /api/transcripts──>  save transcript ──> MongoDB
                                                                     │
                                                                     ▼
                                                               Gemini 2.5 Flash
                                                          title, summary, tasks
                                                                     │
                                                    ┌────────────────┴────────────────┐
                                                    ▼                                 ▼
                                          "What Happened" event              tasks with due dates
                                                    │                                 │
  Your Day / Calendar / Transcripts  <──────────────┴──────── GET /api/... ───────────┘
```

Search runs on a MongoDB text index, so it needs no external service. Gemini is used only to understand each conversation once, right after it's saved.

## Tech stack

| Layer    | Tools |
|----------|-------|
| App      | Expo SDK 57, React Native 0.86, Expo Router, Reanimated 4, Gesture Handler, react-native-svg |
| Speech   | `expo-speech-recognition` (the platform's native recognizer) |
| Backend  | Node 22, Express, Mongoose |
| Database | MongoDB (text index for search) |
| AI       | Google Gemini 2.5 Flash via `@google/generative-ai` |

## Project structure

```
Cilo/
├── .env                      backend config (not committed)
├── backend/
│   ├── server.js             Express app, routes, error handling
│   ├── models/               Transcript and Event (task / "what happened") schemas
│   ├── routes/               /api/transcripts, /api/events
│   ├── services/
│   │   ├── gemini.js         summary, title and task extraction
│   │   ├── ingest.js         transcript -> summary event + tasks, due-date parsing
│   │   └── search.js         ranked text search with best-sentence snippets
│   └── seed.js               sample data (wipes the database first)
└── cilo/                     Expo app
    ├── app/
    │   ├── index.js          hello page
    │   ├── record.tsx        full-screen recorder
    │   ├── tabs/             Calendar, Transcripts, Your Day
    │   └── transcript/[id]   transcript detail
    ├── components/
    │   ├── record-orb.tsx            the liquid droplet (SVG, animated on the UI thread)
    │   └── floating-record-button.tsx draggable orb that snaps to the screen edge
    ├── constants/time-theme.ts       time-of-day palettes
    ├── hooks/use-time-theme.ts       keeps the palette current while the app is open
    └── services/
        ├── api.ts            backend client
        └── speech.ts         loads speech recognition only when the native module exists
```

## Getting started

### Prerequisites

- Node 22 (`cilo/.nvmrc` pins 22.16.0)
- MongoDB running locally (`brew services start mongodb-community`)
- Xcode with an iOS simulator, or Android Studio
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Configure

Create `.env` in the repo root:

```
MONGODB_URI=mongodb://localhost:27017/cilo
PORT=3000
GEMINI_API_KEY=your-key-here
```

### 2. Run the backend

```
cd backend
npm install
npm run dev
```

`npm run dev` restarts on file changes. Wait for `MongoDB Connected`.

### 3. Run the app

Cilo uses a native speech module, so it runs in a **development build**, not Expo Go.

```
cd cilo
npm install
npx expo run:ios            # or: npx expo run:android
```

After the first build, day-to-day work only needs:

```
npx expo start              # then press i (or scan the QR code with the dev build)
```

Rebuild with `npx expo run:ios` only when you add a package with native code or change `app.json`. To run on a physical iPhone, plug it in and use `npx expo run:ios --device` (keep it on the same Wi-Fi as your Mac).

The app finds the backend automatically through the address Expo serves from. To point it at a deployed backend, set `EXPO_PUBLIC_API_URL`, for example `https://api.example.com/api`.

Opening the project in Expo Go still works: everything except recording runs, and the recorder explains that it needs a development build.

## API

All routes are under `/api`.

**Transcripts**

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/transcripts` | All transcripts, newest first |
| GET    | `/transcripts/search?q=` | Ranked text search with snippets |
| GET    | `/transcripts/:id` | One transcript |
| GET    | `/transcripts/date/:date` | Transcripts on a day (`YYYY-MM-DD`) |
| GET    | `/transcripts/month/:year/:month` | Transcripts in a month |
| POST   | `/transcripts` | Save a transcript and run AI processing. `label` is optional and is generated when omitted. Returns the transcript plus the `tasks` it created |
| POST   | `/transcripts/:id/process` | Re-run AI processing, replacing its generated events |
| PUT    | `/transcripts/:id` | Update a transcript |
| DELETE | `/transcripts/:id` | Delete a transcript and its events |

**Events** (tasks and "What Happened" entries)

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/events/summary/today` | Today's tasks, overdue backlog, and the last week's events |
| GET    | `/events/tasks` | All tasks |
| GET    | `/events/tasks/pending` | Incomplete tasks |
| GET    | `/events/tasks/month/:year/:month` | Tasks due in a month (calendar) |
| GET    | `/events/past` | Recent "What Happened" events |
| GET    | `/events/date/:date` | Events on a day |
| GET    | `/events/:id` | One event |
| POST   | `/events` | Create an event or task |
| PUT    | `/events/:id` | Update an event |
| PATCH  | `/events/:id/toggle` | Toggle task completion |
| DELETE | `/events/:id` | Delete an event |

## Design notes

**The orb.** A closed SVG path built from eight points around a circle. Layered sine waves push each point in and out, and Catmull-Rom curves join them so the outline always stays smooth. A frame clock drives it on the UI thread. Speed and wobble ease between three states: a slow drift when idle, voice-reactive swelling with water-like ripple rings while listening, and a fast churn while processing. The fill uses the same four colors as the hello page, top to bottom.

**Dates.** Gemini returns due dates as `YYYY-MM-DD`. These are stored at local noon instead of UTC midnight, so a task due Friday lands on Friday in every US timezone rather than on Thursday evening.

**Long recordings.** Phone recognizers stop on long silences and platform time limits. The recorder restarts them without interrupting you and stitches the segments into one transcript.

## Roadmap

- Speaker labels (who said what)
- Meaning-based search (for example, "costs" finding a conversation about pricing)
- Accounts and sync across devices
- Editing transcripts and tasks in the app
- Deployed backend and TestFlight builds
