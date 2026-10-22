# Compass Ops connector

Read-only MCP connector over The Compass Firestore data (sign-ups, user journey,
funnel, site visits, activity rollups). Lives on its own orphan branch
`ops-connector`; it shares nothing with the site code on `main`.

Endpoint: `/api/mcp/<OPS_CONNECTOR_TOKEN>` (the token is the key; treat the URL like a password).

Env vars: FIREBASE_PROJECT_ID, FIREBASE_WEB_API_KEY, FIREBASE_ROBOT_EMAIL,
FIREBASE_ROBOT_PASSWORD (same robot as the site), OPS_CONNECTOR_TOKEN.
