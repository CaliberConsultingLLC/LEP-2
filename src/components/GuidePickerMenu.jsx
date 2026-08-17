import React from 'react';
import { Box, Popover, Stack } from '@mui/material';
import { useGuide } from '../context/GuideContext';
import { colors, fonts, radii, shadows } from '../styles/tokens';

export default function GuidePickerMenu({ open, anchorEl, onClose, isDark = false }) {
  const { personas, personaId, setPersona } = useGuide();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.75,
            p: 0.5,
            minWidth: 210,
            borderRadius: radii.md,
            border: isDark ? '1px solid rgba(244,206,161,0.2)' : `1px solid ${colors.sand200}`,
            boxShadow: shadows.overlay,
            bgcolor: isDark ? colors.navy800 : colors.surface1,
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
                onClose?.();
              }}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: radii.sm,
                fontFamily: fonts.sans,
                fontSize: 14,
                fontWeight: selected ? 700 : 600,
                color: selected ? colors.amberSoft : isDark ? colors.ink : colors.navy900,
                bgcolor: selected ? colors.navy900 : 'transparent',
                transition: 'background 140ms, color 140ms',
                '&:hover': {
                  bgcolor: selected ? colors.navy800 : isDark ? 'rgba(244,206,161,0.08)' : colors.sand50,
                },
                '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: radii.circle,
                  flexShrink: 0,
                  background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${p.accent} 55%, rgba(0,0,0,0.18))`,
                  border: `1.5px solid ${selected ? colors.amberSoft : 'rgba(15,28,46,0.25)'}`,
                  boxShadow: selected ? '0 0 0 2px rgba(244,206,161,0.35)' : 'none',
                }}
              />
              {p.name}
            </Box>
          );
        })}
      </Stack>
    </Popover>
  );
}
