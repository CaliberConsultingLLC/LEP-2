import React from 'react';
import { Box } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function CairnFlowButtons({
  isDark,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled = false,
  backDisabled = false,
  middleAction = null,
}) {
  const baseButton = {
    all: 'unset',
    cursor: 'pointer',
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    transition: '180ms ease',
    flexShrink: 0,
    '&:focus-visible': { outline: '3px solid rgba(224,122,63,0.4)', outlineOffset: 3 },
  };
  const labelSx = {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
    fontSize: { xs: '0.78rem', sm: '0.86rem' },
    letterSpacing: '0.01em',
    color: isDark ? 'rgba(240,233,222,0.78)' : 'var(--ink-soft, #44566C)',
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: { xs: 1, sm: 1.35 },
      flexWrap: { xs: 'wrap', sm: 'nowrap' },
      width: '100%',
    }}>
      <Box sx={{ ...labelSx, opacity: backDisabled ? 0.45 : 1, textAlign: 'right' }}>
        {backLabel}
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        sx={{
          ...baseButton,
          cursor: backDisabled ? 'default' : 'pointer',
          opacity: backDisabled ? 0.45 : 1,
          border: isDark ? '1.5px solid rgba(244,206,161,0.26)' : '1.5px solid var(--sand-300, #C9B99A)',
          color: isDark ? 'var(--amber-soft, #F4CEA1)' : 'var(--ink-soft, #44566C)',
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.72)',
          '&:hover': backDisabled ? {} : {
            borderColor: isDark ? 'rgba(244,206,161,0.42)' : 'var(--orange, #E07A3F)',
            color: isDark ? 'var(--ink, #f0e9de)' : 'var(--navy-900, #10223C)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        <ChevronLeftIcon sx={{ fontSize: 19 }} />
      </Box>
      {middleAction}
      <Box
        component="button"
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        sx={{
          ...baseButton,
          cursor: nextDisabled ? 'default' : 'pointer',
          opacity: nextDisabled ? 0.45 : 1,
          bgcolor: nextDisabled ? 'var(--sand-200, #E8DBC3)' : 'var(--orange, #E07A3F)',
          color: nextDisabled ? 'var(--ink-soft, #44566C)' : '#fff',
          boxShadow: nextDisabled ? 'none' : '0 6px 22px rgba(224,122,63,0.28)',
          '&:hover': nextDisabled ? {} : {
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 28px rgba(224,122,63,0.34)',
          },
        }}
      >
        <ChevronRightIcon sx={{ fontSize: 19 }} />
      </Box>
      <Box sx={{ ...labelSx, opacity: nextDisabled ? 0.45 : 1, textAlign: 'left' }}>
        {nextLabel}
      </Box>
    </Box>
  );
}

export default CairnFlowButtons;
