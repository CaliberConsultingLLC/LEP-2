import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_GUIDE_ID, GUIDE_PERSONAS, getPersona } from '../data/guidePersonas';

const STORAGE_KEY = 'cairnGuide';

const readState = () => {
  if (typeof window === 'undefined') return { personaId: DEFAULT_GUIDE_ID, hidden: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { personaId: DEFAULT_GUIDE_ID, hidden: false };
    const parsed = JSON.parse(raw);
    const personaId = GUIDE_PERSONAS.some((p) => p.id === parsed?.personaId)
      ? parsed.personaId
      : DEFAULT_GUIDE_ID;
    return { personaId, hidden: Boolean(parsed?.hidden) };
  } catch {
    return { personaId: DEFAULT_GUIDE_ID, hidden: false };
  }
};

const writeState = (next) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — ignore */
  }
};

const GuideContext = createContext(null);

export function GuideProvider({ children }) {
  const [state, setState] = useState(readState);
  const [suppress, setSuppress] = useState(false);
  // Pages can push a contextual message that overrides the rotating route bank.
  // Shape: { text: string, pose?: string, eyebrow?: string } | null
  const [pageMessage, setPageMessageState] = useState(null);

  useEffect(() => {
    writeState(state);
  }, [state]);

  const setPersona = useCallback((personaId) => {
    setState((prev) => ({ ...prev, personaId }));
  }, []);

  const toggleHidden = useCallback(() => {
    setState((prev) => ({ ...prev, hidden: !prev.hidden }));
  }, []);

  const setHidden = useCallback((hidden) => {
    setState((prev) => ({ ...prev, hidden: Boolean(hidden) }));
  }, []);

  const setPageMessage = useCallback((msg) => {
    setPageMessageState(msg && msg.text ? msg : null);
  }, []);

  const clearPageMessage = useCallback(() => setPageMessageState(null), []);

  const value = useMemo(
    () => ({
      personaId: state.personaId,
      persona: getPersona(state.personaId),
      hidden: state.hidden,
      suppress,
      pageMessage,
      setPersona,
      toggleHidden,
      setHidden,
      setSuppress,
      setPageMessage,
      clearPageMessage,
      personas: GUIDE_PERSONAS,
    }),
    [state, suppress, pageMessage, setPersona, toggleHidden, setHidden, setSuppress, setPageMessage, clearPageMessage],
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const ctx = useContext(GuideContext);
  if (!ctx) {
    // Safe fallback when provider is absent (e.g. production build without Cairn).
    return {
      personaId: DEFAULT_GUIDE_ID,
      persona: getPersona(DEFAULT_GUIDE_ID),
      hidden: true,
      suppress: false,
      pageMessage: null,
      setPersona: () => {},
      toggleHidden: () => {},
      setHidden: () => {},
      setSuppress: () => {},
      setPageMessage: () => {},
      clearPageMessage: () => {},
      personas: GUIDE_PERSONAS,
    };
  }
  return ctx;
}
