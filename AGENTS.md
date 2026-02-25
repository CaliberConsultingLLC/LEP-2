# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

"The Compass" (LEP) is an AI-powered leadership development platform. It consists of two services:

| Service | Command | Port | Description |
|---------|---------|------|-------------|
| Vite React frontend | `npx vite --host 0.0.0.0` | 5173 | React SPA with MUI/Chakra UI |
| Express backend | `OPENAI_API_KEY=<key> node server.js` | 3001 | API server for AI summaries, campaigns, Firestore |

Both can be started together with `npm run dev`, but note this runs `node server.js & vite` which backgrounds the server without output visibility.

### Key caveats

- **OpenAI SDK v4 crashes at init without a key.** The Express server (`server.js`) will throw at startup if `OPENAI_API_KEY` is not set. Use a placeholder value (e.g., `OPENAI_API_KEY=sk-placeholder`) to start the server without real AI features.
- **Firebase client config is hardcoded** in `src/firebase.js` (no env vars needed for the frontend).
- **Firebase Admin SDK** in `server.js` uses `FIREBASE_SERVICE_ACCOUNT` (JSON string) or falls back to Application Default Credentials. Without either, Firestore-dependent routes will fail at call time but the server still starts.
- **No automated test framework** is configured in this project. There are no unit or integration tests.
- **ESLint** has pre-existing errors in the codebase (54 errors, 9 warnings). This is normal for the current state of the repo.
- The `api/` directory has its own `package.json` for Vercel serverless functions — run `npm install` in both `/workspace` and `/workspace/api`.
- Vite proxies `/api` requests to `http://localhost:3001` (configured in `vite.config.js`).

### Standard commands

- **Lint:** `npx eslint .`
- **Build:** `npx vite build`
- **Dev (both):** `npm run dev`
- **Dev (frontend only):** `npx vite --host 0.0.0.0`
- **Dev (backend only):** `OPENAI_API_KEY=sk-placeholder node server.js`
