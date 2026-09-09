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

// The hosts where this build is a workshop rather than a product.
//
// This replaces `isProductionHost`, which named the ONE host that had to be
// safe — `app.northstarpartners.org` — and left every other host running with
// the staging seed, the dev panel, the dev routes and the auth bypass all
// switched on. Any domain nobody had thought of was, by default, the
// dangerous case. Attaching compass.northstarpartners.org under that rule
// would have shipped the workshop to the public.
//
// The list now names the hosts that GET the tools. Anything not on it is
// treated as the product, so an unrecognised host is the safe case. Adding a
// domain is no longer a thing that can quietly open a door.
// Matched exactly, or by suffix for the wildcard case. Deliberately NOT a
// substring test: `host.includes('localhost')` would also hand the tools to
// `notlocalhost.com`, and `includes('compass-staging')` to anyone who put
// that string in a domain they control. A rule that decides who gets an auth
// bypass should not be satisfiable by a substring.
const DEV_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  'staging.northstarpartners.org',
]);

// Every Vercel deployment URL for this project, including branch previews.
const DEV_HOST_SUFFIXES = ['.vercel.app'];

export const isDevHost = (() => {
  const host = getHostname();
  if (!host) return false;
  if (DEV_HOSTS.has(host)) return true;
  return DEV_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
})();

// Dev tooling is granted by where the build is running or how it was built —
// never by the URL a visitor types.
//
// Both flags used to read `?dev=1`, or any path starting with `/dev-`, as
// permission to turn themselves on. That made the flag authorize its own use:
// on any host, `/dashboard?dev=1` walked straight past ProtectedRoute with no
// account, and `/dev-repository` mounted the repository console because the
// path prefix flipped the same switch that gated the route. A flag a stranger
// can set is not a flag.
export const showDevTools =
  import.meta.env.DEV || isTrue(import.meta.env.VITE_ENABLE_DEV_TOOLS) || isDevHost;

export const allowDevBypass =
  import.meta.env.DEV || isTrue(import.meta.env.VITE_ENABLE_DEV_BYPASS) || isDevHost;

// Real team data is the default now.
//
// This used to fall back to 'fake' whenever the env var was unset, which meant
// a deployment that simply never had the variable added would serve invented
// team answers to a paying customer — no error, no banner, nothing to notice.
// Unset now means fake on a workshop host and real everywhere else, and either
// can still be forced by name.
export const useFakeDashboardData = (() => {
  const source = normalize(import.meta.env.VITE_DASHBOARD_DATA_SOURCE);
  if (source === 'real') return false;
  if (source === 'fake') return true;
  return isDevHost;
})();

// Label only — this is what puts the STAGING chip in the top bar. Gate
// behaviour on `isDevHost`, never on this.
export const isStagingHost = (() => {
  const host = getHostname();
  if (!host) return false;
  return host === 'staging.northstarpartners.org' || host.startsWith('compass-staging');
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
// The dashboard is already past that point. `/dashboard` renders the Command
// Center on every theme; the legacy ribbon-nav dashboard and its three tabs
// (ResultsTab, ActionTabStaging, GrowthCampaignTab) were deleted once nothing
// but `?theme=legacy` could reach them and their copy had drifted a rename
// behind the live product. What is left of this flag is the marketing, intake,
// and survey skins.
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

// Both bypasses default OFF everywhere except a demo session.
//
// They used to default on for the staging host, which made sense while staging
// was a rehearsal. It is the product now — it takes real money at
// staging.northstarpartners.org — so defaulting to "skip auth, let writes fail
// quietly" meant the storefront shipped with an open dashboard and silent data
// loss. The auth bypass also hid a real failure for an afternoon: with it on,
// ProtectedRoute returned early and never subscribed to onAuthStateChanged, so
// Firebase never restored the session and the paywall read a signed-in leader
// as unpaid.
//
// A demo session still needs both: it has no account and must not write.
// Anyone who wants the old staging behaviour back sets the env var explicitly
// — and now that only counts on a dev host, so setting it cannot reach the
// public site by accident.
//
// To rehearse production on staging — real login, real Firestore writes, real
// campaign tokens — leave both unset, which is the default.
const resolveBypass = (envValue) => {
  if (isDemoRuntime) return true;
  if (!isDevHost) return false;
  return boolEnv(envValue, false);
};

// Lets `ProtectedRoute` hand out the dashboard with no Firebase user.
export const allowAuthBypass = resolveBypass(import.meta.env.VITE_ALLOW_AUTH_BYPASS);

// Lets intake and campaign writes swallow Firestore permission errors and
// hand out placeholder campaign access tokens instead of signed ones.
export const allowPersistenceBypass = resolveBypass(import.meta.env.VITE_ALLOW_PERSISTENCE_BYPASS);
