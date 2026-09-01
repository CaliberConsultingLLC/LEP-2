const normalize = (value) => String(value || '').trim().toLowerCase();

const isTrue = (value) => normalize(value) === 'true';

const getHostname = () => {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.location.hostname || '').toLowerCase();
  } catch {
    return '';
  }
};

const getQueryParam = (name) => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search || '');
    return params.get(name);
  } catch {
    return null;
  }
};

const runtimeDevOverride = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const qsEnabled = ['1', 'true', 'yes', 'on'].includes(normalize(getQueryParam('dev')));
    const pathEnabled = String(window.location.pathname || '').startsWith('/dev-');
    return qsEnabled || pathEnabled;
  } catch {
    return false;
  }
})();

export const showDevTools =
  import.meta.env.DEV || isTrue(import.meta.env.VITE_ENABLE_DEV_TOOLS) || runtimeDevOverride;

export const allowDevBypass =
  import.meta.env.DEV || isTrue(import.meta.env.VITE_ENABLE_DEV_BYPASS) || runtimeDevOverride;

export const useFakeDashboardData =
  normalize(import.meta.env.VITE_DASHBOARD_DATA_SOURCE || 'fake') !== 'real';

const STAGING_HOST_NEEDLES = ['staging.northstarpartners.org', 'compass-staging'];

export const isStagingHost = (() => {
  const host = getHostname();
  if (!host) return false;
  return STAGING_HOST_NEEDLES.some((needle) => host.includes(needle));
})();

export const isProductionHost = (() => {
  const host = getHostname();
  if (!host || isStagingHost) return false;
  return host.includes('app.northstarpartners.org');
})();

const isDemoRuntime = (() => {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('compassDemo') === '1') return true;
    const path = String(window.location.pathname || '');
    return path === '/demo' || path.startsWith('/demo/');
  } catch {
    return false;
  }
})();

// The Cairn build IS the product. This used to be host-gated — off on
// app.northstarpartners.org, on everywhere else — which meant pointing the
// real domain at this codebase would have silently served the abandoned
// legacy skin instead of the app. The default is now inverted: Cairn renders
// on every host, and the legacy skin survives only behind an explicit opt-in
// so the old pages stay reachable for comparison until they are deleted.
//
// Opt back into legacy with `?theme=legacy` on any URL, or VITE_LEGACY_SKIN=true.
//
// This flag is the SKIN AND NOTHING ELSE. It used to also stand in for "we are
// on staging, so skip auth and let Firestore writes fail quietly", which meant
// the new design could not ship without shipping an open dashboard alongside
// it. Those two are now `allowAuthBypass` and `allowPersistenceBypass` below,
// and each can be turned off on its own.
export const useCairnTheme = (() => {
  const override = normalize(getQueryParam('theme'));
  if (override === 'legacy') return false;
  if (isTrue(import.meta.env.VITE_LEGACY_SKIN)) return false;
  return true;
})();

// Reads a tri-state env var: unset falls back to `fallback`, anything else is
// an explicit true/false. Lets a bypass be switched off without code changes.
const boolEnv = (raw, fallback) => {
  const value = normalize(raw);
  if (value === '') return fallback;
  return value === 'true' || value === '1' || value === 'yes';
};

// Both bypasses default to today's behaviour so the current staging QA loop
// keeps working, and both are hard-off on the production host regardless of
// what the environment says.
//
// To rehearse production on staging — real login, real Firestore writes, real
// campaign tokens — set these to "false" and reload:
//   VITE_ALLOW_AUTH_BYPASS=false
//   VITE_ALLOW_PERSISTENCE_BYPASS=false

// Lets `ProtectedRoute` hand out the dashboard with no Firebase user.
export const allowAuthBypass = isProductionHost
  ? false
  : boolEnv(import.meta.env.VITE_ALLOW_AUTH_BYPASS, isStagingHost || isDemoRuntime);

// Lets intake and campaign writes swallow Firestore permission errors and
// hand out placeholder campaign access tokens instead of signed ones.
export const allowPersistenceBypass = isProductionHost
  ? false
  : boolEnv(import.meta.env.VITE_ALLOW_PERSISTENCE_BYPASS, isStagingHost || isDemoRuntime);
