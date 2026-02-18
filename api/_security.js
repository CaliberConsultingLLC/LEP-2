const RATE_BUCKETS = new Map();

function nowMs() {
  return Date.now();
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return (
    req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown'
  );
}

function bucketKey(req, action) {
  return `${action}:${getClientIp(req)}`;
}

export function applyRateLimit(req, res, options = {}) {
  const {
    action = 'default',
    limit = 30,
    windowMs = 60_000,
  } = options;

  const key = bucketKey(req, action);
  const current = RATE_BUCKETS.get(key);
  const now = nowMs();

  if (!current || now >= current.resetAt) {
    RATE_BUCKETS.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true };
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  current.count += 1;
  RATE_BUCKETS.set(key, current);
  return { allowed: true };
}

export function ensureJsonObjectBody(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Invalid request body' });
    return false;
  }
  return true;
}

export function requireInternalKey(req, res) {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    res.status(404).json({ error: 'Not found' });
    return false;
  }

  const provided = req.headers['x-internal-key'];
  if (provided !== expected) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  return true;
}

export function safeServerError(res, logLabel, error) {
  console.error(logLabel, error);
  return res.status(500).json({ error: 'Internal server error' });
}
