import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, radii, shadows, surfaces } from '../styles/tokens';

/**
 * Index rail — a stacked list of consistent-size items, vertically centered
 * beside a content card that keeps all four rounded corners.
 */
export default function CairnLeftRail({
  tabs = [],
  activeId,
  onChange,
  children,
  isDark = false,
  contentSelected = false,
  railLabel = '',
}) {
  const inactiveBg = isDark ? 'rgba(255,255,255,0.04)' : colors.sand100;
  const border = isDark ? 'rgba(244,206,161,0.14)' : colors.sand200;
  const selectedFill = isDark
    ? `linear-gradient(180deg, color-mix(in srgb, ${colors.green} 28%, ${colors.surface1}) 0%, color-mix(in srgb, ${colors.greenSoft} 16%, ${colors.surface1}) 42%, ${colors.surface1} 100%)`
    : `linear-gradient(180deg, color-mix(in srgb, ${colors.green} 20%, ${colors.surface1}) 0%, color-mix(in srgb, ${colors.greenSoft} 12%, ${colors.sand50}) 38%, ${colors.surface1} 100%)`;
  const selectedBorder = isDark
    ? 'color-mix(in srgb, var(--green) 45%, transparent)'
    : 'color-mix(in srgb, var(--green) 35%, var(--sand-200))';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'stretch' },
        width: '100%',
        flex: 1,
        minHeight: { md: 0 },
        height: { md: '100%' },
        gap: { xs: 1.5, md: 2 },
      }}
    >
      <Box
        component="nav"
        aria-label={railLabel || 'Section index'}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          flexShrink: 0,
          width: { xs: '100%', md: 236 },
          alignSelf: { xs: 'stretch', md: 'center' },
          gap: 1,
          overflowX: { xs: 'auto', md: 'visible' },
        }}
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeId;
          const marked = Boolean(tab.selected);
          const number = tab.number || tab.roman || tab.icon || String(index + 1);
          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              onClick={() => onChange?.(tab.id)}
              aria-current={active ? 'page' : undefined}
              sx={{
                appearance: 'none',
                WebkitAppearance: 'none',
                margin: 0,
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                width: { xs: 'auto', md: '100%' },
                minWidth: { xs: 168, md: 0 },
                minHeight: 58,
                flexShrink: 0,
                px: 1.4,
                py: 1.05,
                bgcolor: active ? colors.navy900 : inactiveBg,
                color: active ? colors.amberSoft : (isDark ? colors.ink : colors.navy900),
                border: `1px solid ${active ? colors.navy900 : border}`,
                borderRadius: radii.pill,
                boxShadow: active ? shadows.buttonPrimary : shadows.none,
                transition: 'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
                '&:hover': {
                  bgcolor: active
                    ? colors.navy800
                    : (isDark ? 'rgba(255,255,255,0.07)' : colors.sand50),
                },
                '&:focus-visible': {
                  outline: `3px solid ${colors.ringFocus}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.circle,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: marked
                    ? colors.green
                    : active
                      ? colors.orange
                      : (isDark ? 'rgba(244,206,161,0.12)' : colors.sand200),
                  color: marked || active
                    ? colors.surface1
                    : (isDark ? colors.amberSoft : colors.navy900),
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fonts.serif,
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    lineHeight: 1,
                    color: 'inherit',
                  }}
                >
                  {marked ? '✓' : number}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontFamily: fonts.sans,
                    fontWeight: active ? 800 : 700,
                    fontSize: '0.86rem',
                    lineHeight: 1.25,
                    letterSpacing: '0.01em',
                    color: active ? colors.amberSoft : (isDark ? colors.ink : colors.navy900),
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {tab.label}
                </Typography>
                {tab.subtitle ? (
                  <Typography
                    sx={{
                      fontFamily: fonts.sans,
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      lineHeight: 1.3,
                      mt: 0.15,
                      color: active
                        ? 'rgba(244,206,161,0.72)'
                        : (isDark ? 'rgba(240,233,222,0.55)' : colors.inkSoft),
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {tab.subtitle}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          ...surfaces.card,
          flex: 1,
          minWidth: 0,
          minHeight: { md: 0 },
          height: { md: '100%' },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: contentSelected ? undefined : colors.surface1,
          background: contentSelected ? selectedFill : colors.surface1,
          border: `1px solid ${contentSelected ? selectedBorder : border}`,
          borderRadius: radii.lg,
          boxShadow: shadows.card,
          p: { xs: 2.5, md: 3.5 },
          overflow: 'hidden',
          transition: 'background 220ms ease, border-color 220ms ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
