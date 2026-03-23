const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

function coerceSignInUrl(candidate, fallbackBase = '') {
  const normalizedCandidate = normalizeUrl(candidate);
  const normalizedBase = normalizeUrl(fallbackBase);
  const fallbackUrl = normalizedBase ? `${normalizedBase}/sign-in` : '/sign-in';

  if (!normalizedCandidate) return fallbackUrl;

  try {
    const parsed = normalizedCandidate.startsWith('http')
      ? new URL(normalizedCandidate)
      : new URL(normalizedCandidate, normalizedBase || 'https://compass.local');

    if (parsed.pathname === '/user-info') {
      parsed.pathname = '/sign-in';
      parsed.search = '';
      parsed.hash = '';
      return parsed.origin === 'https://compass.local'
        ? `${parsed.pathname}${parsed.search}${parsed.hash}`
        : normalizeUrl(parsed.toString());
    }

    return parsed.origin === 'https://compass.local'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : normalizeUrl(parsed.toString());
  } catch {
    return fallbackUrl;
  }
}

export function getCompassBaseUrl() {
  const envBase = normalizeUrl(import.meta.env.VITE_APP_BASE_URL);
  if (envBase) return envBase;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeUrl(window.location.origin);
  }

  return '';
}

export function getCompassSignInUrl() {
  const baseUrl = getCompassBaseUrl();
  return coerceSignInUrl(import.meta.env.VITE_APP_SIGN_IN_URL, baseUrl);
}

export function buildPasswordResetActionSettings(email = '') {
  const signInUrl = getCompassSignInUrl();
  const targetUrl = email
    ? `${signInUrl}?reset=1&email=${encodeURIComponent(String(email || '').trim().toLowerCase())}`
    : signInUrl;

  return {
    url: targetUrl,
    handleCodeInApp: false,
  };
}
