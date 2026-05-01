import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { seedStagingData, clearStagingData, STAGING_SELF_ID, STAGING_TEAM_ID } from '../utils/stagingSeed';

const PAGE_GROUPS = [
  {
    label: 'Start',
    pages: [
      { label: 'Landing', path: '/' },
      { label: 'Sign In', path: '/sign-in' },
      { label: 'I - Profile', path: '/user-info' },
      { label: 'I - Profile Details', path: '/form?stage=profile' },
      { label: 'I - Guide Select', path: '/guide-select' },
    ],
  },
  {
    label: 'Assessment',
    pages: [
      { label: 'II - Intake Form', path: '/form?stage=intake' },
      { label: 'III - Summary', path: '/summary' },
      { label: 'III - Summary Snapshot', path: '/summary-static' },
    ],
  },
  {
    label: 'Campaign Build',
    pages: [
      { label: 'IV - Trait Selection', path: '/trait-selection' },
      { label: 'IV - Campaign Intro', path: '/campaign-intro' },
      { label: 'IV - Campaign Builder', path: '/campaign-builder' },
      { label: 'V - Verify / Launch', path: '/campaign-verify' },
    ],
  },
  {
    label: 'Assessments',
    pages: [
      { label: 'V - Self Intro', path: `/campaign/${STAGING_SELF_ID}` },
      { label: 'V - Self Survey', path: `/campaign/${STAGING_SELF_ID}/survey` },
      { label: 'V - Self Complete', path: `/campaign/${STAGING_SELF_ID}/complete` },
      { label: 'VI - Team Intro', path: `/campaign/${STAGING_TEAM_ID}` },
      { label: 'VI - Team Survey', path: `/campaign/${STAGING_TEAM_ID}/survey` },
      { label: 'VI - Team Complete', path: `/campaign/${STAGING_TEAM_ID}/complete` },
    ],
  },
  {
    label: 'Command Center',
    pages: [
      { label: 'Current Bearing', path: '/dashboard?tab=current-bearing' },
      { label: 'Signals', path: '/dashboard?tab=signals' },
      { label: 'Evidence', path: '/dashboard?tab=evidence' },
      { label: 'Practice', path: '/dashboard?tab=practice' },
      { label: 'Journey', path: '/dashboard?tab=journey' },
    ],
  },
];

function StagingDevPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState('');

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
      {/* Expanded panel */}
      {open && (
        <Box
          sx={{
            pointerEvents: 'all',
            bgcolor: 'var(--navy-900, #10223C)',
            border: '1px solid rgba(244,206,161,0.25)',
            borderRadius: '14px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
            p: '14px 10px 10px',
            width: 252,
            maxHeight: 'min(72vh, 680px)',
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

          {/* Page links */}
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

          {/* Divider */}
          <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: '4px', mb: 1 }} />

          {/* Data utilities */}
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
                    all: 'unset',
                    cursor: 'pointer',
                    textAlign: 'center',
                    px: '10px',
                    py: '6px',
                    borderRadius: '8px',
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'var(--amber-soft, #F4CEA1)',
                    border: '1px solid rgba(244,206,161,0.3)',
                    transition: '120ms',
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
                      all: 'unset',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center',
                      px: '8px',
                      py: '5px',
                      borderRadius: '8px',
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 600,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      transition: '120ms',
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
                      all: 'unset',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center',
                      px: '8px',
                      py: '5px',
                      borderRadius: '8px',
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 600,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      transition: '120ms',
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

      {/* Toggle pill */}
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
