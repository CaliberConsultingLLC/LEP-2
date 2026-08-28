import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GUIDE_VOICE_IDS, getGuideVoice } from '../data/guideVoices';
import { seedStagingData, clearStagingData, STAGING_SELF_ID, STAGING_TEAM_ID } from '../utils/stagingSeed';
import { STAGING_PERSONAS } from '../data/stagingPersonas';

const PAGE_GROUPS = [
  {
    label: 'Start',
    pages: [
      { label: 'Landing', path: '/' },
      { label: 'Sign In', path: '/sign-in' },
      { label: 'I - Account', path: '/user-info' },
      { label: 'I - Guide Select', path: '/guide-select' },
      { label: 'I - Your Context', path: '/form?stage=profile' },
    ],
  },
  {
    label: 'Assessment',
    pages: [
      { label: 'II - Daily Behaviors', path: '/form?stage=intake' },
      { label: 'III - Summary', path: '/summary' },
      { label: 'III - Summary Snapshot', path: '/summary-static' },
    ],
  },
  {
    label: 'Growth Campaign',
    pages: [
      { label: 'IV - Trait Selection', path: '/trait-selection' },
      { label: 'IV - Campaign Builder', path: '/campaign-builder' },
      { label: 'IV - Review and Submit', path: '/campaign-verify' },
    ],
  },
  {
    label: 'Campaign Assessment',
    pages: [
      { label: 'V - Information', path: '/self-assessment' },
      { label: 'V - Self Survey', path: `/campaign/${STAGING_SELF_ID}/survey` },
      { label: 'V - Self Complete', path: `/campaign/${STAGING_SELF_ID}/complete` },
      { label: 'V - Team Invite', path: '/self-assessment?step=invite' },
      { label: 'V - Team Intro', path: `/campaign/${STAGING_TEAM_ID}` },
      { label: 'V - Team Survey', path: `/campaign/${STAGING_TEAM_ID}/survey` },
    ],
  },
  {
    label: 'Command Center',
    pages: [
      { label: 'VI - Today', path: '/dashboard?tab=today' },
      { label: 'VI - Signal', path: '/dashboard?tab=signal' },
      { label: 'VI - Evidence', path: '/dashboard?tab=evidence' },
      { label: 'VI - Practice', path: '/dashboard?tab=practice' },
      { label: 'VII - Journey', path: '/dashboard?tab=journey' },
    ],
  },
];

const SUMMARY_VOICES = GUIDE_VOICE_IDS.map((id) => ({
  id,
  label: getGuideVoice(id).name,
}));

const utilBtnSx = {
  all: 'unset',
  cursor: 'pointer',
  textAlign: 'center',
  px: '10px',
  py: '6px',
  borderRadius: '8px',
  fontFamily: '"Manrope", sans-serif',
  fontWeight: 700,
  fontSize: 11,
  boxSizing: 'border-box',
  transition: '120ms',
};

function readStagingIntakePayload() {
  try {
    const latest = JSON.parse(localStorage.getItem('latestFormData') || 'null');
    if (latest && typeof latest === 'object') return latest;
  } catch { /* ignore */ }
  try {
    const draft = JSON.parse(localStorage.getItem('intakeDraft') || 'null');
    if (draft?.formData && typeof draft.formData === 'object') {
      return {
        ...draft.formData,
        societalResponses: draft.societalResponses || draft.formData.societalResponses,
      };
    }
  } catch { /* ignore */ }
  return null;
}

function StagingDevPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState('');
  const [voiceId, setVoiceId] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedAgent');
      if (SUMMARY_VOICES.some((v) => v.id === saved)) return saved;
    } catch { /* ignore */ }
    return 'mentor';
  });
  const [regenBusy, setRegenBusy] = useState(false);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleSeed = () => {
    seedStagingData();
    setFlash('Data seeded ✓');
    setTimeout(() => setFlash(''), 2000);
  };

  const handleClear = () => {
    clearStagingData();
    setFlash('Data cleared ✓');
    setTimeout(() => setFlash(''), 2000);
  };

  const handleReset = () => {
    clearStagingData();
    seedStagingData();
    setFlash('Reset ✓ — reload to apply');
    setTimeout(() => setFlash(''), 3000);
  };

  // Without an override this regenerates whatever intake is in localStorage —
  // which on staging is always the same seeded Alex Rivera, so repeated presses
  // return near-identical summaries. The persona button exists to vary the
  // actual input rather than rerolling the same leader.
  const handleRegenerateSummary = async (personaOverride = null) => {
    if (regenBusy) return;
    let payload = readStagingIntakePayload();
    if (!payload) {
      seedStagingData();
      payload = readStagingIntakePayload();
    }
    if (!payload) {
      setFlash('No intake data — Seed first');
      setTimeout(() => setFlash(''), 2500);
      return;
    }

    if (personaOverride?.data) {
      // Keep the seeded identity (name, email, uid) so auth and Firestore
      // paths keep working; replace the leadership content wholesale.
      payload = {
        ...payload,
        ...personaOverride.data,
        name: payload.name,
        email: payload.email,
      };
      localStorage.setItem('latestFormData', JSON.stringify(payload));
    }

    setRegenBusy(true);
    setFlash(personaOverride
      ? `Generating as ${personaOverride.label.split(' · ')[0]}… (~3 min)`
      : 'Generating live summary… (all six voices, ~3 min)');
    try {
      localStorage.setItem('selectedAgent', voiceId);
      localStorage.setItem('selectedGuideId', voiceId);
      // This panel asks for all six voices in one request, so it runs longer
      // than the Summary page's two-phase flow. Without a timeout a stalled
      // request spins forever with no way to tell it failed.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 280000);
      let res;
      try {
        res = await fetch('/api/get-ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...payload, guideId: voiceId, selectedAgent: voiceId }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${errText ? `: ${errText.slice(0, 120)}` : ''}`);
      }
      const json = await res.json();
      const text = String(json?.aiSummary || '').trim();
      if (!text) throw new Error('Empty summary returned');

      localStorage.setItem('aiSummary', text);
      if (json?.summariesByGuide && typeof json.summariesByGuide === 'object') {
        localStorage.setItem('summariesByGuide', JSON.stringify(json.summariesByGuide));
      }
      if (json?.selectedGuideId) {
        localStorage.setItem('selectedGuideId', json.selectedGuideId);
      }
      if (Array.isArray(json?.focusAreas) && json.focusAreas.length) {
        localStorage.setItem('focusAreas', JSON.stringify(json.focusAreas));
      }
      if (json?.trailheadHighlights) {
        localStorage.setItem('trailheadHighlights', JSON.stringify(json.trailheadHighlights));
      } else {
        localStorage.removeItem('trailheadHighlights');
      }
      localStorage.setItem('summarySavedAt', new Date().toISOString());

      setFlash('Live summary ready ✓');
      setTimeout(() => {
        window.location.assign('/summary');
      }, 400);
    } catch (err) {
      console.error('[StageNavigator] regenerate summary failed:', err);
      setFlash(`Regen failed: ${err?.message || 'error'}`);
      setTimeout(() => setFlash(''), 4000);
    } finally {
      setRegenBusy(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
        pointerEvents: 'none',
      }}
    >
      {open && (
        <Box
          sx={{
            pointerEvents: 'all',
            bgcolor: 'var(--navy-900, #10223C)',
            border: '1px solid rgba(244,206,161,0.25)',
            borderRadius: '14px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
            p: '14px 10px 10px',
            width: 268,
            maxHeight: 'min(72vh, 720px)',
            overflowY: 'auto',
            mb: '2px',
          }}
        >
          <Box
            sx={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--amber-soft, #F4CEA1)',
              mb: '10px',
              px: '4px',
            }}
          >
            Stage Navigator
          </Box>

          <Stack spacing={0.7} sx={{ mb: 1 }}>
            {PAGE_GROUPS.map((group) => (
              <Box key={group.label}>
                <Box
                  sx={{
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(244,206,161,0.58)',
                    px: '6px',
                    py: '4px',
                  }}
                >
                  {group.label}
                </Box>
                <Stack spacing={0.2}>
                  {group.pages.map((p) => (
                    <Box
                      key={p.path}
                      component="button"
                      type="button"
                      onClick={() => go(p.path)}
                      sx={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'block',
                        width: '100%',
                        px: '10px',
                        py: '5.5px',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                        fontFamily: '"Manrope", "Inter", sans-serif',
                        fontWeight: 650,
                        fontSize: 11.5,
                        color: 'rgba(255,255,255,0.88)',
                        transition: '120ms',
                        '&:hover': {
                          bgcolor: 'rgba(244,206,161,0.12)',
                          color: 'var(--amber-soft, #F4CEA1)',
                        },
                        '&:focus-visible': { outline: '2px solid rgba(244,206,161,0.5)', outlineOffset: 1 },
                      }}
                    >
                      {p.label}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>

          <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: '4px', mb: 1 }} />

          <Stack spacing={0.55} sx={{ px: '4px', mb: 1 }}>
            <Box
              sx={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(244,206,161,0.58)',
                px: '2px',
              }}
            >
              Live summary test
            </Box>
            <Box
              component="select"
              value={voiceId}
              disabled={regenBusy}
              onChange={(e) => setVoiceId(e.target.value)}
              aria-label="Summary guide voice"
              sx={{
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: '8px',
                border: '1px solid rgba(244,206,161,0.28)',
                bgcolor: 'rgba(255,255,255,0.06)',
                color: 'var(--amber-soft, #F4CEA1)',
                fontFamily: '"Manrope", sans-serif',
                fontSize: 11.5,
                fontWeight: 650,
                px: '8px',
                py: '7px',
                outline: 'none',
                cursor: regenBusy ? 'wait' : 'pointer',
              }}
            >
              {SUMMARY_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id} style={{ color: '#10223C' }}>
                  {voice.label}
                </option>
              ))}
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => handleRegenerateSummary(null)}
              disabled={regenBusy}
              sx={{
                ...utilBtnSx,
                color: 'var(--navy-900, #10223C)',
                bgcolor: regenBusy ? 'rgba(244,206,161,0.55)' : 'var(--amber-soft, #F4CEA1)',
                border: '1px solid rgba(244,206,161,0.55)',
                opacity: regenBusy ? 0.85 : 1,
                cursor: regenBusy ? 'wait' : 'pointer',
                '&:hover': regenBusy ? {} : { filter: 'brightness(1.05)' },
              }}
            >
              {regenBusy ? 'Generating…' : '↻ Regenerate live summary'}
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => {
                const idx = (Number(localStorage.getItem('stagingPersonaIdx') || '-1') + 1) % STAGING_PERSONAS.length;
                localStorage.setItem('stagingPersonaIdx', String(idx));
                handleRegenerateSummary(STAGING_PERSONAS[idx]);
              }}
              disabled={regenBusy}
              title={STAGING_PERSONAS.map((persona, i) => `${i + 1}. ${persona.label}`).join('\n')}
              sx={{
                ...utilBtnSx,
                color: 'var(--amber-soft, #F4CEA1)',
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(244,206,161,0.35)',
                opacity: regenBusy ? 0.7 : 1,
                cursor: regenBusy ? 'wait' : 'pointer',
                '&:hover': regenBusy ? {} : { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              {regenBusy ? 'Generating…' : '🎲 Next persona → regenerate'}
            </Box>
          </Stack>

          <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: '4px', mb: 1 }} />

          <Stack spacing={0.5} sx={{ px: '4px' }}>
            {flash ? (
              <Box sx={{ fontFamily: '"Manrope", sans-serif', fontSize: 11, color: '#6EE7B7', py: '4px', textAlign: 'center' }}>
                {flash}
              </Box>
            ) : (
              <>
                <Box
                  component="button"
                  type="button"
                  onClick={handleReset}
                  sx={{
                    ...utilBtnSx,
                    color: 'var(--amber-soft, #F4CEA1)',
                    border: '1px solid rgba(244,206,161,0.3)',
                    '&:hover': { bgcolor: 'rgba(244,206,161,0.1)' },
                  }}
                >
                  ↺ Reset All Data
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Box
                    component="button"
                    type="button"
                    onClick={handleSeed}
                    sx={{
                      ...utilBtnSx,
                      flex: 1,
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
                    }}
                  >
                    Seed
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={handleClear}
                    sx={{
                      ...utilBtnSx,
                      flex: 1,
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
                    }}
                  >
                    Clear
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      )}

      <Box
        component="button"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Stage navigator"
        sx={{
          all: 'unset',
          pointerEvents: 'all',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          px: '12px',
          py: '7px',
          borderRadius: 999,
          bgcolor: open ? 'var(--navy-900, #10223C)' : 'rgba(16,34,60,0.88)',
          border: '1px solid rgba(244,206,161,0.35)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.14em',
          color: 'var(--amber-soft, #F4CEA1)',
          textTransform: 'uppercase',
          transition: 'all 160ms',
          '&:hover': { bgcolor: 'var(--navy-900, #10223C)', borderColor: 'rgba(244,206,161,0.6)' },
          '&:focus-visible': { outline: '2px solid rgba(244,206,161,0.5)', outlineOffset: 2 },
        }}
      >
        <Box aria-hidden sx={{ fontSize: 10 }}>◈</Box>
        Stage
        <Box aria-hidden sx={{ fontSize: 8, opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}>▾</Box>
      </Box>
    </Box>
  );
}

export default StagingDevPanel;
