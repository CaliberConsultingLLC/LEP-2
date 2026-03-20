const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

export function getCompassBaseUrl() {
  const envBase = normalizeUrl(import.meta.env.VITE_APP_BASE_URL);
  if (envBase) return envBase;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeUrl(window.location.origin);
  }

  return '';
}

export function getCompassSignInUrl() {
  const envSignIn = normalizeUrl(import.meta.env.VITE_APP_SIGN_IN_URL);
  if (envSignIn) return envSignIn;

  const baseUrl = getCompassBaseUrl();
  return baseUrl ? `${baseUrl}/sign-in` : '/sign-in';
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
