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

// Enable the Cairn visual skin when on the staging host, or when explicitly
// requested via `?theme=cairn` (useful for previewing on other hosts).
// Production host (app.northstarpartners.org) never enables this.
export const useCairnTheme = (() => {
  if (isStagingHost) return true;
  const override = normalize(getQueryParam('theme'));
  return override === 'cairn';
})();
