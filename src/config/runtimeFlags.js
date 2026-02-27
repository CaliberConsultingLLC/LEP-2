const normalize = (value) => String(value || '').trim().toLowerCase();

const isTrue = (value) => normalize(value) === 'true';

export const showDevTools =
  import.meta.env.DEV || isTrue(import.meta.env.VITE_ENABLE_DEV_TOOLS);

export const allowDevBypass =
  import.meta.env.DEV || isTrue(import.meta.env.VITE_ENABLE_DEV_BYPASS);

export const useFakeDashboardData =
  normalize(import.meta.env.VITE_DASHBOARD_DATA_SOURCE || 'fake') !== 'real';
