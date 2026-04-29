import React, { useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { GUIDE_PERSONAS } from '../data/guidePersonas';
import ProcessTopRail from '../components/ProcessTopRail';
import { useDarkMode } from '../hooks/useDarkMode';

const ROMAN = ['I', 'II', 'III'];

function GuideSelect() {
  const navigate = useNavigate();
  const { personaId, setPersona } = useGuide();
  const [hovered, setHovered] = useState(null);
  const [isDark] = useDarkMode();

  const handleSelect = (id) => setPersona(id);

  const handleBegin = () => navigate('/form');

  return (
    <Box sx={{ minHeight: '100svh', maxHeight: '100svh', bgcolor: 'var(--sand-50, #FBF7F0)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ProcessTopRail />

      {/* Hero section */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
        pt: { xs: 2.5, md: 3 },
        pb: { xs: 2, md: 2.5 },
      }}>

        {/* Overline */}
        <Typography sx={{
          fontFamily: '"Manrope", sans-serif',
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--orange, #E07A3F)',
          mb: 0.75,
        }}>
          Your Guide
        </Typography>

        {/* Heading */}
        <Typography sx={{
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 800,
          fontSize: { xs: '1.75rem', md: '2.2rem' },
          lineHeight: 1.1,
          color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)',
          textAlign: 'center',
          mb: 0.75,
        }}>
          Who walks with you matters.
        </Typography>

        <Typography sx={{
          fontFamily: '"Manrope", sans-serif',
          fontSize: { xs: '0.88rem', md: '0.95rem' },
          color: isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)',
          textAlign: 'center',
          maxWidth: 560,
          lineHeight: 1.55,
          mb: { xs: 2, md: 2.4 },
        }}>
          Your guide shapes how your insights are delivered and the tone of your
          entire leadership journey. Choose the voice that fits you.
        </Typography>

        {/* Guide cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, md: 2 },
          width: '100%',
          maxWidth: 920,
          mb: { xs: 2, md: 2.4 },
        }}>
          {GUIDE_PERSONAS.map((persona, idx) => {
            const isSelected = personaId === persona.id;
            const isHovered = hovered === persona.id;

            return (
              <Box
                key={persona.id}
                component="button"
                type="button"
                onClick={() => handleSelect(persona.id)}
                onMouseEnter={() => setHovered(persona.id)}
                onMouseLeave={() => setHovered(null)}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  border: `2px solid ${isSelected ? persona.accent : isDark ? 'rgba(244,206,161,0.14)' : 'var(--sand-200, #E8DBC3)'}`,
                  bgcolor: isSelected ? isDark ? 'rgba(255,255,255,0.06)' : '#fff' : isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.7)',
                  boxShadow: isSelected
                    ? `0 20px 56px ${persona.accent}38`
                    : isHovered
                    ? '0 12px 32px rgba(0,0,0,0.18)'
                    : isDark ? '0 4px 18px rgba(0,0,0,0.22)' : '0 4px 16px rgba(0,0,0,0.05)',
                  transform: isSelected ? 'translateY(-5px)' : isHovered ? 'translateY(-2px)' : 'none',
                  transition: 'all 300ms cubic-bezier(.2,.8,.2,1)',
                  overflow: 'hidden',
                  textAlign: 'left',
                  '&:focus-visible': {
                    outline: `3px solid ${persona.accent}88`,
                    outlineOffset: 3,
                  },
                }}
              >
                {/* Accent top bar */}
                <Box sx={{ height: 5, bgcolor: persona.accent, width: '100%', flexShrink: 0 }} />

                {/* Image area */}
                <Box sx={{
                  height: { xs: 150, md: 176 },
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  bgcolor: `${persona.accent}12`,
                  overflow: 'hidden',
                  position: 'relative',
                  px: 2,
                  pt: 2,
                }}>
                  {/* Roman numeral badge */}
                  <Box sx={{
                    position: 'absolute',
                    top: 14, left: 14,
                    width: 32, height: 32,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.85)',
                    border: `1.5px solid ${persona.accent}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Typography sx={{
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: persona.accent,
                    }}>
                      {ROMAN[idx]}
                    </Typography>
                  </Box>

                  <Box
                    component="img"
                    src={persona.poses.greet || persona.poses.idle}
                    alt={persona.name}
                    sx={{ height: { xs: 138, md: 162 }, objectFit: 'contain', objectPosition: 'bottom', display: 'block' }}
                  />
                </Box>

                {/* Text content */}
                <Box sx={{ p: { xs: '14px 16px 10px', md: '16px 18px 10px' }, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.45 }}>
                  <Typography sx={{
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: '1.12rem', md: '1.28rem' },
                    lineHeight: 1.1,
                    color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)',
                    textAlign: 'center',
                  }}>
                    {persona.name}
                  </Typography>

                  <Typography sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    color: persona.accent,
                    fontStyle: 'italic',
                    lineHeight: 1.35,
                    textAlign: 'center',
                  }}>
                    {persona.tagline}
                  </Typography>

                  <Typography sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontSize: '0.76rem',
                    color: isDark ? 'rgba(240,233,222,0.58)' : 'var(--ink-soft, #44566C)',
                    lineHeight: 1.45,
                    mt: 0.2,
                    textAlign: 'center',
                  }}>
                    {persona.voice}
                  </Typography>
                </Box>

                {/* Selection pill */}
                <Box sx={{ px: 2, pb: 1.6, pt: 0.6 }}>
                  <Box sx={{
                    height: 34,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    bgcolor: isSelected ? persona.accent : 'transparent',
                    border: `1.5px solid ${isSelected ? persona.accent : 'var(--sand-200, #E8DBC3)'}`,
                    transition: 'all 250ms ease',
                  }}>
                    {isSelected && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#fff', lineHeight: 1 }}>✓</Typography>
                    )}
                    <Typography sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isSelected ? '#fff' : 'var(--ink-soft, #44566C)',
                    }}>
                      {isSelected ? 'Selected' : 'Choose'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* CTA */}
        <Stack spacing={1.5} alignItems="center">
          <Box
            component="button"
            type="button"
            onClick={handleBegin}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              px: '36px',
              py: '12px',
              borderRadius: 999,
              bgcolor: 'var(--navy-900, #10223C)',
              color: 'var(--amber-soft, #F4CEA1)',
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 800,
              fontSize: '0.94rem',
              letterSpacing: '0.02em',
              boxShadow: '0 10px 32px rgba(16,34,60,0.28)',
              transition: 'all 220ms ease',
              '&:hover': {
                bgcolor: 'var(--navy-800, #162A44)',
                transform: 'translateY(-2px)',
                boxShadow: '0 16px 40px rgba(16,34,60,0.38)',
              },
              '&:focus-visible': {
                outline: '3px solid rgba(224,122,63,0.48)',
                outlineOffset: 3,
              },
            }}
          >
            Begin My Journey
            <Box component="span" sx={{ fontSize: '1.2rem', lineHeight: 1 }}>→</Box>
          </Box>

          <Typography sx={{
            fontFamily: '"Manrope", sans-serif',
            fontSize: '0.74rem',
            color: isDark ? 'rgba(240,233,222,0.5)' : 'var(--ink-soft, #44566C)',
            opacity: 0.7,
          }}>
            You can change your guide at any time during the process.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default GuideSelect;
