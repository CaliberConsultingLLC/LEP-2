import React, { useRef, useState } from 'react';
import { Box, Popover, Stack } from '@mui/material';
import { useGuide } from '../context/GuideContext';

// Pendant-style placeholder thumb. Filled circle in the persona's accent
// colour with a thin ring to suggest the medallion the character wears.
// Swap to cropped pendant art in a later pass.
function Pendant({ color, size = 18, active = false }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${color} 55%, rgba(0,0,0,0.18))`,
        border: `1.5px solid ${active ? 'var(--amber-soft, #F4CEA1)' : 'rgba(15,28,46,0.25)'}`,
        boxShadow: active
          ? '0 0 0 2px rgba(244,206,161,0.45)'
          : '0 1px 2px rgba(15,28,46,0.18)',
      }}
    />
  );
}

// Replaces the legacy ProcessTopRail when the Cairn skin is active.
// A single "Guide" pill sits centred at the top of the page; clicking it
// opens a small popover listing the three personas so the user can swap
// their guide at any time.
function GuideSelector({ embedded = false, sticky = true }) {
  const { personas, personaId, persona, setPersona } = useGuide();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const wrapperSx = embedded
    ? { width: '100%' }
    : {
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 7,
        width: '100%',
        backgroundColor: 'var(--sand-50, #FBF7F0)',
        borderBottom: '1px solid var(--sand-200, #E8DBC3)',
      };

  return (
    <Box sx={wrapperSx}>
      <Box
        sx={{
          px: embedded ? 0 : { xs: 2, md: 3.5 },
          py: embedded ? 0 : { xs: 1.25, md: 1.6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="button"
          type="button"
          ref={anchorRef}
          onClick={() => setOpen(true)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Guide — currently ${persona.name}`}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.2,
            padding: '8px 18px 8px 12px',
            borderRadius: 999,
            border: '1px solid var(--navy-900, #10223C)',
            backgroundColor: 'var(--navy-900, #10223C)',
            color: 'var(--amber-soft, #F4CEA1)',
            fontFamily: '"Manrope", "Inter", sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
            boxShadow: '0 10px 24px rgba(15,28,46,0.18)',
            '&:hover': {
              transform: 'translateY(-1px)',
              backgroundColor: 'var(--navy-800, #162A44)',
            },
            '&:focus-visible': {
              outline: '3px solid rgba(224,122,63,0.32)',
              outlineOffset: 2,
            },
          }}
        >
          <Pendant color={persona.accent} size={22} active />
          Guide
          <Box
            aria-hidden
            sx={{
              fontSize: 10,
              opacity: 0.75,
              marginLeft: 0.25,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 180ms',
            }}
          >
            ▾
          </Box>
        </Box>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              marginTop: 1,
              padding: 0.5,
              minWidth: 220,
              borderRadius: '14px',
              border: '1px solid var(--sand-200, #E8DBC3)',
              boxShadow: '0 18px 40px rgba(15,28,46,0.18)',
              background: '#FFFFFF',
            },
          },
        }}
      >
        <Stack role="listbox" aria-label="Choose guide" spacing={0.25}>
          {personas.map((p) => {
            const selected = p.id === personaId;
            return (
              <Box
                key={p.id}
                component="button"
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setPersona(p.id);
                  setOpen(false);
                }}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontFamily: '"Manrope", "Inter", sans-serif',
                  fontSize: 14,
                  fontWeight: selected ? 700 : 600,
                  color: selected
                    ? 'var(--amber-soft, #F4CEA1)'
                    : 'var(--navy-900, #10223C)',
                  background: selected
                    ? 'var(--navy-900, #10223C)'
                    : 'transparent',
                  transition: 'background 140ms, color 140ms',
                  '&:hover': {
                    background: selected
                      ? 'var(--navy-800, #162A44)'
                      : 'var(--sand-50, #FBF7F0)',
                  },
                  '&:focus-visible': {
                    outline: '3px solid rgba(224,122,63,0.32)',
                    outlineOffset: 2,
                  },
                }}
              >
                <Pendant color={p.accent} size={22} active={selected} />
                {p.name}
              </Box>
            );
          })}
        </Stack>
      </Popover>
    </Box>
  );
}

export default GuideSelector;
