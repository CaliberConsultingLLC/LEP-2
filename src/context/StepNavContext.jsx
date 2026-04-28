import React, { createContext, useCallback, useContext, useState } from 'react';

// Pages with internal step navigation register their handlers here so
// CompassTopbar's back/forward arrows control steps instead of routes.
//
// Usage in a page:
//   const { register, unregister } = useStepNav();
//   useEffect(() => {
//     register({ canGoBack, canGoForward, goBack, goForward });
//     return unregister;
//   }, [canGoBack, canGoForward]);

const StepNavContext = createContext(null);

export function StepNavProvider({ children }) {
  const [nav, setNav] = useState(null);
  const register   = useCallback((navObj) => setNav(navObj), []);
  const unregister = useCallback(() => setNav(null), []);
  return (
    <StepNavContext.Provider value={{ nav, register, unregister }}>
      {children}
    </StepNavContext.Provider>
  );
}

export function useStepNav() {
  return useContext(StepNavContext) ?? { nav: null, register: () => {}, unregister: () => {} };
}
