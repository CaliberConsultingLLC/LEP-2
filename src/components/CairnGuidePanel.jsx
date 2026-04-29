import React, { useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';

function CairnGuidePanel({
  persona,
  hidden,
  setHidden,
  toggleHidden,
  isDark,
  commentary,
  children,
  owlPose,
  moreLabel = 'More Guidance',
}) {
  const [expanded, setExpanded] = useState(false);

  if (hidden) {
    return (
      <Box
        component="button"
        type="button"
        onClick={() => setHidden(false)}
        aria-label={`Show ${persona.name} guide`}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          position: 'fixed',
          right: 0,
          bottom: 32,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '10px 14px 10px 16px',
          borderRadius: '14px 0 0 14px',
          background: 'var(--navy-900, #10223C)',
          color: 'var(--amber-soft, #F4CEA1)',
          boxShadow: '0 12px 28px rgba(15,28,46,0.28)',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)',
          '&:hover': { transform: 'translateX(-3px)' },
          '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
        }}
      >
        <Box
          component="img"
          src={persona.poses.idle}
          alt=""
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'top center',
            border: '2px solid var(--amber-soft, #F4CEA1)',
            background: 'var(--navy-800, #162A44)',
          }}
        />
        Guide
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 10, md: 16, lg: 24 },
        bottom: 0,
        zIndex: 1100,
        width: 'clamp(250px, 25vw, 350px)',
        pointerEvents: 'none',
      }}
    >
      <Box sx={{
        position: 'relative',
        borderRadius: '18px',
        border: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
        bgcolor: isDark ? 'rgba(8,16,28,0.82)' : 'rgba(255,255,255,0.86)',
        boxShadow: isDark ? '0 16px 42px rgba(0,0,0,0.34)' : '0 14px 32px rgba(15,28,46,0.08)',
        p: 2.1,
        pointerEvents: 'auto',
        backdropFilter: 'blur(10px)',
        '&:after': {
          content: '""',
          position: 'absolute',
          right: 78,
          bottom: -10,
          width: 18,
          height: 18,
          bgcolor: isDark ? 'rgba(8,16,28,0.82)' : 'rgba(255,255,255,0.86)',
          borderRight: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
          borderBottom: isDark ? '1px solid rgba(244,206,161,0.14)' : '1px solid var(--sand-200, #E8DBC3)',
          transform: 'rotate(45deg)',
        },
      }}>
        <Box
          component="button"
          type="button"
          onClick={toggleHidden}
          aria-label="Hide guide"
          sx={{
            all: 'unset',
            cursor: 'pointer',
            position: 'absolute',
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? 'rgba(240,233,222,0.72)' : 'var(--ink-soft, #44566C)',
            fontFamily: '"Manrope", sans-serif',
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 600,
            transition: 'background 140ms',
            '&:hover': { background: isDark ? 'rgba(244,206,161,0.1)' : 'var(--sand-100, #F4ECDD)' },
            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 2 },
          }}
        >
          ×
        </Box>

        <Typography sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.64rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--orange-deep, #C0612A)',
          mb: 1.35,
        }}>
          Guide Notes
        </Typography>
        <Typography sx={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '0.94rem',
          lineHeight: 1.62,
          color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)',
        }}>
          "{commentary}"
        </Typography>

        <Box sx={{ my: 1.5, borderTop: isDark ? '1px solid rgba(244,206,161,0.12)' : '1px solid var(--sand-200, #E8DBC3)' }} />

        <Box
          component="button"
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            fontFamily: '"Montserrat", sans-serif',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--orange-deep, #C0612A)',
            letterSpacing: '0.02em',
            '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.32)', outlineOffset: 3, borderRadius: 999 },
          }}
        >
          {moreLabel}
          <Box component="span" sx={{ fontSize: '0.8rem', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>⌄</Box>
        </Box>

        <Collapse in={expanded} timeout="auto">
          <Box sx={{ pt: 1.35 }}>
            {children}
          </Box>
        </Collapse>
      </Box>

      <Box
        component="img"
        src={owlPose || persona.poses.idle}
        alt={`${persona.name} guide`}
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'bottom right',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
        onClick={toggleHidden}
        draggable={false}
      />
    </Box>
  );
}

export default CairnGuidePanel;
