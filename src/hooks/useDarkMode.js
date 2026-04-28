import { useCallback, useEffect, useState } from 'react';

const LS_KEY = 'cairn_dark_mode';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(LS_KEY) === 'true');

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-dark', 'true');
    } else {
      document.documentElement.removeAttribute('data-dark');
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(LS_KEY, String(next));
      return next;
    });
  }, []);

  return [isDark, toggle];
}
