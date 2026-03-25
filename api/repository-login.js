import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function getRepositoryUsername() {
  return String(process.env.REPOSITORY_ADMIN_USERNAME || '').trim();
}

function getRepositoryPassword() {
  return String(process.env.REPOSITORY_ADMIN_PASSWORD || '');
}

function getRepositorySessionToken() {
  return String(process.env.REPOSITORY_SESSION_TOKEN || '').trim();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'repository-login',
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    if (!getRepositoryUsername() || !getRepositoryPassword() || !getRepositorySessionToken()) {
      return res.status(503).json({ error: 'Repository auth is not configured' });
    }

    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (username !== getRepositoryUsername() || password !== getRepositoryPassword()) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({
      ok: true,
      token: getRepositorySessionToken(),
      username: getRepositoryUsername(),
    });
  } catch (error) {
    return safeServerError(res, 'repository-login error:', error);
  }
}
