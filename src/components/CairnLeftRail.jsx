import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, fonts, radii, shadows, surfaces } from '../styles/tokens';

/**
 * Connected index rail — left tabs share one card with the content pane
 * and stretch to fill its height. Three-item rails (campaign builder) use
 * the same structure with taller, evenly spaced entries.
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
  const tabCount = tabs.length;
  const compactRail = tabCount > 0 && tabCount <= 3;
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
        alignItems: 'stretch',
        width: '100%',
        height: { md: '100%' },
        minHeight: { md: 0 },
        flex: 1,
        ...surfaces.card,
        border: `1px solid ${contentSelected ? selectedBorder : border}`,
        bgcolor: colors.surface1,
        overflow: 'hidden',
        boxShadow: shadows.card,
      }}
    >
      <Box
        component="nav"
        aria-label={railLabel || 'Section index'}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          flexShrink: 0,
          width: { xs: '100%', md: compactRail ? 228 : 248 },
          alignSelf: 'stretch',
          borderRight: { md: `1px solid ${border}` },
          borderBottom: { xs: `1px solid ${border}`, md: 'none' },
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : colors.sand50,
          overflowX: { xs: 'auto', md: 'hidden' },
          overflowY: 'hidden',
        }}
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeId;
          const marked = Boolean(tab.selected);
          const number = tab.number || tab.roman || tab.icon || String(index + 1);
          const last = index === tabCount - 1;
          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              onClick={() => onChange?.(tab.id)}
              aria-current={active ? 'page' : undefined}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: compactRail ? 1.4 : 1.25,
                width: { xs: 'auto', md: '100%' },
                minWidth: { xs: 168, md: 0 },
                flex: { xs: '0 0 auto', md: 1 },
                minHeight: {
                  xs: 52,
                  md: compactRail ? 96 : 72,
                },
                px: compactRail ? 1.7 : 1.45,
                py: compactRail ? 1.5 : 1.2,
                flexShrink: 0,
                bgcolor: active ? colors.navy900 : 'transparent',
                color: active ? colors.amberSoft : (isDark ? colors.ink : colors.navy900),
                borderBottom: {
                  xs: 'none',
                  md: last ? 'none' : `1px solid ${active ? colors.navy800 : border}`,
                },
                borderRight: {
                  xs: last ? 'none' : `1px solid ${active ? colors.navy800 : border}`,
                  md: 'none',
                },
                transition: 'background-color 160ms ease, color 160ms ease',
                '&:hover': {
                  bgcolor: active
                    ? colors.navy800
                    : (isDark ? 'rgba(255,255,255,0.06)' : colors.sand100),
                },
                '&:focus-visible': {
                  outline: `3px solid ${colors.ringFocus}`,
                  outlineOffset: -3,
                },
              }}
            >
              <Box
                sx={{
                  width: compactRail ? 34 : 30,
                  height: compactRail ? 34 : 30,
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
                    fontSize: compactRail ? '0.86rem' : '0.78rem',
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
                    fontSize: compactRail ? '0.96rem' : '0.88rem',
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
                      fontSize: compactRail ? '0.78rem' : '0.72rem',
                      lineHeight: 1.35,
                      mt: 0.3,
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
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: contentSelected ? undefined : 'transparent',
          background: contentSelected ? selectedFill : 'transparent',
          p: { xs: 2.5, md: compactRail ? 3.25 : 3.5 },
          overflow: 'hidden',
          transition: 'background 220ms ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
