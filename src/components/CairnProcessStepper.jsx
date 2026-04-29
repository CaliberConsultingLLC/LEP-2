import React from 'react';
import { Box, Typography } from '@mui/material';

function CairnProcessStepper({
  steps,
  activeIndex,
  onStepChange,
  isDark,
  showConnector = true,
  fixedCircleSize = false,
  connectorVariant = 'dash',
}) {
  const progress = steps.length > 1 ? activeIndex / (steps.length - 1) : 0;
  const circleSize = fixedCircleSize ? 66 : null;

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        px: { xs: 0.5, md: 1 },
        pb: 0.5,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: `repeat(${steps.length}, minmax(148px, 1fr))`, md: `repeat(${steps.length}, 1fr)` },
          minWidth: { xs: Math.max(steps.length * 148, 592), md: 0 },
          gap: { xs: 1.25, md: 2 },
          alignItems: 'start',
          ...(showConnector && {
            '&:before': {
              content: '""',
              position: 'absolute',
              top: { xs: 31, md: 36 },
              left: '8%',
              right: '8%',
              height: connectorVariant === 'journey' ? 3 : 0,
              borderRadius: 999,
              borderTop: connectorVariant === 'journey'
                ? 'none'
                : isDark ? '1px dashed rgba(244,206,161,0.24)' : '1px dashed rgba(16,34,60,0.2)',
              background: connectorVariant === 'journey'
                ? `repeating-linear-gradient(90deg, ${isDark ? 'rgba(244,206,161,0.18)' : 'rgba(16,34,60,0.16)'} 0 8px, transparent 8px 16px)`
                : 'transparent',
              zIndex: 0,
              pointerEvents: 'none',
            },
            ...(connectorVariant === 'journey' && {
              '&:after': {
                content: '""',
                position: 'absolute',
                top: { xs: 31, md: 36 },
                left: '8%',
                width: `calc((100% - 16%) * ${progress})`,
                height: 3,
                borderRadius: 999,
                background: 'linear-gradient(90deg, var(--orange, #E07A3F), var(--amber-soft, #F4CEA1))',
                boxShadow: isDark ? '0 0 12px rgba(224,122,63,0.28)' : '0 0 10px rgba(224,122,63,0.22)',
                zIndex: 1,
                pointerEvents: 'none',
                transition: 'width 260ms cubic-bezier(.2,.8,.2,1)',
              },
            }),
          }),
        }}
      >
        {steps.map((step, idx) => {
          const active = idx === activeIndex;
          const Icon = step.icon;
          return (
            <Box
              key={step.id || step.label}
              component="button"
              type="button"
              onClick={() => onStepChange(idx)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 0.75,
                px: 0.75,
                py: 0.5,
                borderRadius: '16px',
                transition: 'transform 180ms ease',
                '&:hover': { transform: 'translateY(-2px)' },
                '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 3 },
              }}
            >
              <Box
                sx={{
                  width: fixedCircleSize ? circleSize : active ? 76 : 58,
                  height: fixedCircleSize ? circleSize : active ? 76 : 58,
                  position: 'relative',
                  zIndex: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: active
                    ? 'var(--amber-soft, #F4CEA1)'
                    : isDark ? 'var(--navy-800, #162A44)' : 'var(--surface-1, #ffffff)',
                  border: active
                    ? '3px solid var(--orange, #E07A3F)'
                    : isDark ? '1px solid rgba(244,206,161,0.2)' : '1px solid var(--sand-200, #E8DBC3)',
                  boxShadow: active
                    ? isDark
                      ? '0 0 0 7px rgba(224,122,63,0.14), 0 0 24px rgba(224,122,63,0.26)'
                      : '0 0 0 7px rgba(224,122,63,0.12), 0 0 22px rgba(224,122,63,0.22)'
                    : isDark ? '0 0 0 5px rgba(15,28,46,0.78)' : '0 0 0 5px rgba(255,255,255,0.92)',
                  color: active
                    ? 'var(--navy-900, #10223C)'
                    : isDark ? 'rgba(244,206,161,0.58)' : 'var(--ink-soft, #44566C)',
                  transition: 'all 220ms cubic-bezier(.2,.8,.2,1)',
                }}
              >
                {Icon ? <Icon sx={{ fontSize: fixedCircleSize ? (active ? 31 : 27) : active ? 34 : 26 }} /> : (
                  <Typography sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: fixedCircleSize ? (active ? '1.18rem' : '1.05rem') : active ? '1.35rem' : '1.05rem' }}>
                    {idx + 1}
                  </Typography>
                )}
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: active ? 900 : 800,
                  fontSize: active ? '0.86rem' : '0.8rem',
                  lineHeight: 1.22,
                  color: active
                    ? isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)'
                    : isDark ? 'rgba(240,233,222,0.62)' : 'var(--ink-soft, #44566C)',
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default CairnProcessStepper;
