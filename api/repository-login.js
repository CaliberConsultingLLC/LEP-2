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

function getEffectiveRepositoryAuth() {
  const username = getRepositoryUsername();
  const password = getRepositoryPassword();
  const token = getRepositorySessionToken();
  if (username && password && token) return { username, password, token, mode: 'env' };
  return { username: '', password: '', token: '', mode: 'missing' };
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

    const auth = getEffectiveRepositoryAuth();
    if (!auth.username || !auth.password || !auth.token) {
      return res.status(503).json({ error: 'Repository auth is not configured' });
    }

    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (username !== auth.username || password !== auth.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({
      ok: true,
      token: auth.token,
      username: auth.username,
    });
  } catch (error) {
    return safeServerError(res, 'repository-login error:', error);
  }
}
