import React, { useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import { colors, fonts, radii, shadows } from '../styles/tokens';

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
  const bubbleBg = isDark ? 'rgba(8,16,28,0.88)' : 'rgba(255,255,255,0.92)';
  const bubbleBorder = isDark ? '1px solid rgba(244,206,161,0.14)' : `1px solid ${colors.sand200}`;

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
          borderRadius: `${radii.md} 0 0 ${radii.md}`,
          background: colors.navy900,
          color: colors.amberSoft,
          boxShadow: shadows.overlay,
          fontFamily: fonts.mono,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'transform 180ms cubic-bezier(.2,.8,.2,1)',
          '&:hover': { transform: 'translateX(-3px)' },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
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
            borderRadius: radii.circle,
            objectFit: 'cover',
            objectPosition: 'top center',
            border: `2px solid ${colors.amberSoft}`,
            background: colors.navy800,
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
        right: { xs: 6, md: 10, lg: 16 },
        bottom: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'flex-end',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: 188, sm: 210, md: 220 },
          flexShrink: 0,
          borderRadius: radii.md,
          border: bubbleBorder,
          bgcolor: bubbleBg,
          boxShadow: shadows.overlay,
          p: '16px 18px 18px',
          mb: '10px',
          pointerEvents: 'auto',
          backdropFilter: 'blur(10px)',
          '&:after': {
            content: '""',
            position: 'absolute',
            right: -8,
            bottom: 28,
            width: 16,
            height: 16,
            bgcolor: bubbleBg,
            borderRight: bubbleBorder,
            borderTop: bubbleBorder,
            transform: 'rotate(45deg)',
            zIndex: 1,
          },
        }}
      >
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
            borderRadius: radii.circle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? 'rgba(240,233,222,0.72)' : colors.inkSoft,
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 600,
            transition: 'background 140ms',
            '&:hover': { background: isDark ? 'rgba(244,206,161,0.1)' : colors.sand100 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          ×
        </Box>

        <Typography sx={{
          fontFamily: fonts.mono,
          fontSize: '0.64rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: colors.orangeDeep,
          mb: 1.1,
          pr: '18px',
        }}>
          Guide Notes
        </Typography>
        <Typography sx={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: '0.88rem',
          lineHeight: 1.55,
          color: isDark ? colors.ink : colors.navy900,
        }}>
          "{commentary}"
        </Typography>

        <Box sx={{ my: 1.25, borderTop: bubbleBorder }} />

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
            fontFamily: fonts.sans,
            fontSize: '0.74rem',
            fontWeight: 800,
            color: isDark ? colors.amberSoft : colors.orangeDeep,
            letterSpacing: '0.02em',
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3, borderRadius: radii.pill },
          }}
        >
          {moreLabel}
          <Box component="span" sx={{ fontSize: '0.8rem', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>⌄</Box>
        </Box>

        <Collapse in={expanded} timeout="auto">
          <Box sx={{ pt: 1.2 }}>
            {children}
          </Box>
        </Collapse>
      </Box>

      <Box
        component="img"
        src={owlPose || persona.poses.idle}
        alt={`${persona.name} guide`}
        sx={{
          width: { xs: 200, sm: 240, md: 280 },
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'bottom right',
          ml: { xs: '-10px', md: '-14px' },
          mb: '-4px',
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 2,
        }}
        onClick={toggleHidden}
        draggable={false}
      />
    </Box>
  );
}

export default CairnGuidePanel;
