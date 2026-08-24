import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_GUIDE_ID, SELECTABLE_GUIDE_PERSONAS, getPersona } from '../data/guidePersonas';

const STORAGE_KEY = 'cairnGuide';

const readState = () => {
  if (typeof window === 'undefined') {
    return { personaId: DEFAULT_GUIDE_ID, hidden: false, selected: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { personaId: DEFAULT_GUIDE_ID, hidden: false, selected: false };
    const parsed = JSON.parse(raw);
    const personaId = SELECTABLE_GUIDE_PERSONAS.some((p) => p.id === parsed?.personaId)
      ? parsed.personaId
      : DEFAULT_GUIDE_ID;
    // Legacy saves had personaId but no selected flag — treat those as selected
    // so returning users keep guide chrome. Brand-new sessions have no storage.
    const selected = typeof parsed?.selected === 'boolean'
      ? parsed.selected
      : Boolean(parsed?.personaId);
    return { personaId, hidden: Boolean(parsed?.hidden), selected: Boolean(selected) };
  } catch {
    return { personaId: DEFAULT_GUIDE_ID, hidden: false, selected: false };
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stepKey, setStepKeyState] = useState('default');

  useEffect(() => {
    writeState(state);
  }, [state]);

  const setPersona = useCallback((personaId) => {
    setState((prev) => ({ ...prev, personaId, selected: true }));
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
  const setGuideStep = useCallback((key) => {
    setStepKeyState(String(key || 'default').trim() || 'default');
  }, []);
  const openGuidePicker = useCallback(() => setPickerOpen(true), []);
  const closeGuidePicker = useCallback(() => setPickerOpen(false), []);

  const value = useMemo(
    () => ({
      personaId: state.personaId,
      persona: getPersona(state.personaId),
      hidden: state.hidden,
      hasSelectedGuide: Boolean(state.selected),
      suppress,
      pageMessage,
      stepKey,
      pickerOpen,
      setPersona,
      toggleHidden,
      setHidden,
      setSuppress,
      setPageMessage,
      clearPageMessage,
      setGuideStep,
      openGuidePicker,
      closeGuidePicker,
      setPickerOpen,
      personas: SELECTABLE_GUIDE_PERSONAS,
    }),
    [state, suppress, pageMessage, stepKey, pickerOpen, setPersona, toggleHidden, setHidden, setSuppress, setPageMessage, clearPageMessage, setGuideStep, openGuidePicker, closeGuidePicker],
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
      hasSelectedGuide: false,
      suppress: false,
      pageMessage: null,
      stepKey: 'default',
      pickerOpen: false,
      setPersona: () => {},
      toggleHidden: () => {},
      setHidden: () => {},
      setSuppress: () => {},
      setPageMessage: () => {},
      clearPageMessage: () => {},
      setGuideStep: () => {},
      openGuidePicker: () => {},
      closeGuidePicker: () => {},
      setPickerOpen: () => {},
      personas: SELECTABLE_GUIDE_PERSONAS,
    };
  }
  return ctx;
}
