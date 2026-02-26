# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

"The Compass" (LEP) is an AI-powered leadership development platform. It consists of two services:

| Service | Command | Port | Description |
|---------|---------|------|-------------|
| Vite React frontend | `npx vite --host 0.0.0.0` | 5173 | React SPA with MUI/Chakra UI |
| Backend (Vercel functions) | See below | 3001 | API server for AI summaries, campaigns |

The frontend calls `/api/*` routes that map to Vercel serverless functions in `api/`. In production these run on Vercel; for local dev you need an Express adapter to serve them (see below).

### Key caveats

- **OpenAI SDK v4 crashes at init without a key.** The Express server (`server.js`) will throw at startup if `OPENAI_API_KEY` is not set. Use a placeholder value (e.g., `OPENAI_API_KEY=sk-placeholder`) to start the server without real AI features.
- **Firebase client config is hardcoded** in `src/firebase.js` (no env vars needed for the frontend).
- **Firebase Admin SDK** in `server.js` uses `FIREBASE_SERVICE_ACCOUNT` (JSON string) or falls back to Application Default Credentials. Without either, Firestore-dependent routes will fail at call time but the server still starts.
- **No automated test framework** is configured in this project. There are no unit or integration tests.
- **ESLint** has pre-existing errors in the codebase (54 errors, 9 warnings). This is normal for the current state of the repo.
- The `api/` directory has its own `package.json` for Vercel serverless functions — run `npm install` in both `/workspace` and `/workspace/api`.
- Vite proxies `/api` requests to `http://localhost:3001` (configured in `vite.config.js`).
- **Route mismatch between server.js and frontend:** The frontend calls `POST /api/get-ai-summary`, but `server.js` only has `GET /get-ai-summary` (no `/api/` prefix, wrong HTTP method). In production, Vercel serverless functions in `api/` handle these routes. For local dev, the `server.js` Express routes do not fully match the frontend's API calls. The AI summary flow (`/summary` page) will return 404 in local dev with `server.js` alone.
- **`FIREBASE_SERVICE_ACCOUNT` must be a full service account JSON string** (starting with `{"type":"service_account",...}`), not the Firebase Web API key. The Web API key (`AIzaSy...`) is only for the client SDK and is already hardcoded in `src/firebase.js`.

### Running the backend locally (serving Vercel API functions)

The `server.js` Express server has route mismatches with the frontend (see caveats). To serve the actual Vercel API functions locally, create a temporary Express adapter that imports the handler functions from `api/*.js` and mounts them at their `/api/*` paths. The Vercel functions (e.g., `api/get-ai-summary.js`) do NOT require Firebase Admin credentials — they receive intake data in the POST body and only need `OPENAI_API_KEY`. Example adapter pattern:

```js
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
const mod = await import('./api/get-ai-summary.js');
app.post('/api/get-ai-summary', async (req, res) => mod.default(req, res));
// ... mount other api/*.js handlers similarly
app.listen(3001);
```

Run with: `OPENAI_API_KEY=<key> node <adapter-file>.mjs`

### Standard commands

- **Lint:** `npx eslint .`
- **Build:** `npx vite build`
- **Dev (frontend only):** `npx vite --host 0.0.0.0`
- **Dev (legacy backend):** `OPENAI_API_KEY=sk-placeholder node server.js` (routes partially mismatched; see caveats)
