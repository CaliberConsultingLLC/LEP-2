import { useCallback, useEffect, useState } from 'react';

const LS_KEY = 'cairn_dark_mode';
const DARK_MODE_EVENT = 'cairn-dark-mode-change';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(LS_KEY) === 'true');

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-dark', 'true');
    } else {
      document.documentElement.removeAttribute('data-dark');
    }
  }, [isDark]);

  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem(LS_KEY) === 'true');
    window.addEventListener('storage', sync);
    window.addEventListener(DARK_MODE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(DARK_MODE_EVENT, sync);
    };
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(LS_KEY, String(next));
      window.dispatchEvent(new Event(DARK_MODE_EVENT));
      return next;
    });
  }, []);

  return [isDark, toggle];
}
