const normalize = (value) => String(value || '').trim().toLowerCase();

const isTrue = (value) => normalize(value) === 'true';

const runtimeDevOverride = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    const qsEnabled = ['1', 'true', 'yes', 'on'].includes(normalize(params.get('dev')));
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
