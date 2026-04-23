import React from 'react';
import { Box, Stack, Tooltip } from '@mui/material';
import { useGuide } from '../context/GuideContext';

// Replaces the legacy ProcessTopRail when the Cairn skin is active.
// Renders exactly three avatar buttons — one per guide persona — with the
// currently selected one highlighted. Selecting a persona swaps the guide
// shown in the floating overlay (GuideOverlay) across the whole app.
function GuideSelector({ embedded = false, sticky = true }) {
  const { personas, personaId, setPersona } = useGuide();

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
          py: embedded ? 0 : { xs: 1.5, md: 1.8 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft, #44566C)',
            display: { xs: 'none', sm: 'block' },
            mr: 0.5,
          }}
        >
          Choose your guide
        </Box>

        <Stack direction="row" spacing={{ xs: 1, md: 1.5 }} alignItems="center">
          {personas.map((persona) => {
            const isActive = persona.id === personaId;
            return (
              <Tooltip
                key={persona.id}
                title={`${persona.name} — ${persona.tagline}`}
                arrow
                placement="bottom"
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setPersona(persona.id)}
                  aria-pressed={isActive}
                  aria-label={`Select guide: ${persona.name}`}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '6px 14px 6px 6px',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: isActive
                      ? 'var(--navy-900, #10223C)'
                      : 'var(--sand-200, #E8DBC3)',
                    backgroundColor: isActive
                      ? 'var(--navy-900, #10223C)'
                      : '#FFFFFF',
                    color: isActive
                      ? 'var(--amber-soft, #F4CEA1)'
                      : 'var(--navy-900, #10223C)',
                    transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
                    boxShadow: isActive
                      ? '0 10px 24px rgba(15,28,46,0.18)'
                      : '0 2px 4px rgba(15,28,46,0.04)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      borderColor: isActive
                        ? 'var(--navy-900, #10223C)'
                        : 'var(--navy-500, #3F647B)',
                    },
                    '&:focus-visible': {
                      outline: '3px solid rgba(224,122,63,0.32)',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: isActive
                        ? 'rgba(244,206,161,0.16)'
                        : 'var(--sand-50, #FBF7F0)',
                      border: `2px solid ${
                        isActive
                          ? 'var(--amber-soft, #F4CEA1)'
                          : 'var(--sand-200, #E8DBC3)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      component="img"
                      src={persona.poses.idle}
                      alt=""
                      aria-hidden
                      sx={{
                        width: '108%',
                        height: '108%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                        display: 'block',
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      fontFamily: '"Manrope", "Inter", sans-serif',
                      fontWeight: 700,
                      fontSize: 12.5,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {persona.name}
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

export default GuideSelector;
