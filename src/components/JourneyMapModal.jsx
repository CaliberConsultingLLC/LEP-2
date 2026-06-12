import React, { useEffect, useState } from 'react';
import { Box, IconButton, Modal, Typography } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {
  chapterText,
  JOURNEY_BASE_SRC,
  JOURNEY_STATIONS,
  getJourneyCompletion,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, radii, shadows, type } from '../styles/tokens';

const STATUS_META = {
  complete: { label: 'Complete', color: 'var(--green)' },
  current: { label: 'You are here', color: 'var(--orange)' },
  upcoming: { label: 'Still ahead', color: 'var(--ink-soft)' },
};

export default function JourneyMapModal({
  open,
  mode = 'reference',
  currentIndex = 0,
  firstName = '',
  onClose,
  completion: completionProp,
}) {
  const completion = completionProp || getJourneyCompletion();
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);
  const selected = JOURNEY_STATIONS[selectedIndex] || JOURNEY_STATIONS[currentIndex] || JOURNEY_STATIONS[0];
  const selectedStatus = getStatus(selectedIndex, currentIndex, completion);
  const displayName = firstName || 'Your';

  useEffect(() => {
    if (open) setSelectedIndex(currentIndex);
  }, [open, currentIndex]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="journey-map-title"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(9,16,31,0.5)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1.5, md: 3 },
          outline: 0,
        }}
      >
        <Box
          sx={{
            bgcolor: colors.sand50,
            borderRadius: radii.xl,
            p: '12px',
            boxShadow: '0 40px 90px rgba(9,16,31,0.4)',
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 24px)',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 'min(calc(94vw - 24px), calc((94vh - 24px) * 1.5))',
              maxWidth: '100%',
              aspectRatio: '3 / 2',
              overflow: 'hidden',
              borderRadius: radii.lg,
              backgroundColor: colors.sand100,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                transformOrigin: 'center center',
              }}
            >
              <Box
                component="img"
                src={JOURNEY_BASE_SRC}
                alt="Your development journey map"
                draggable={false}
                sx={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                }}
              />
              <Typography
                id="journey-map-title"
                sx={{
                  position: 'absolute',
                  top: '6%',
                  left: { xs: '9%', md: '8%' },
                  transform: 'none',
                  fontFamily: fonts.brand,
                  fontVariant: 'small-caps',
                  fontWeight: 600,
                  fontSize: 'clamp(22px, 3.2vw, 34px)',
                  letterSpacing: '-0.035em',
                  color: colors.navy900,
                  lineHeight: 1,
                  textAlign: 'left',
                  maxWidth: '42%',
                  whiteSpace: 'normal',
                  textShadow: '0 1px 0 rgba(251,247,240,0.8), 0 0 18px rgba(251,247,240,0.9)',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                {displayName === 'Your' ? 'Your Development Journey' : `${displayName}'s Development Journey`}
              </Typography>

              <IconButton
                aria-label="Close map"
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 7,
                  bgcolor: 'rgba(255,255,255,0.86)',
                  border: '1px solid var(--sand-200)',
                  color: colors.navy900,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.96)' },
                }}
              >
                <CloseRounded fontSize="small" />
              </IconButton>

              {mode === 'reference' && (
                <ChapterPanel station={selected} index={selectedIndex} status={selectedStatus} />
              )}

              {JOURNEY_STATIONS.map((station, index) => (
                <StationMarker
                  key={station.key}
                  station={station}
                  index={index}
                  status={getStatus(index, currentIndex, completion)}
                  selected={mode === 'reference' && selectedIndex === index}
                  interactive={mode === 'reference'}
                  onSelect={() => setSelectedIndex(index)}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

function getStatus(index, currentIndex, completion) {
  if (completion[index] || index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

function ChapterPanel({ station, index, status }) {
  const meta = STATUS_META[status];
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '20%',
        left: { xs: '8%', md: '8%' },
        transform: 'none',
        width: 'min(42%, 380px)',
        textAlign: 'left',
        bgcolor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--sand-200)',
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        px: { xs: 2, md: 2.4 },
        py: { xs: 1.7, md: 2 },
        zIndex: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
        <Typography sx={{ ...type.eyebrow, fontSize: 8.5, letterSpacing: '0.2em', color: colors.orangeDeep }}>
          {chapterText(index)}
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            px: 0.9,
            py: 0.35,
            borderRadius: radii.pill,
            border: `1px solid ${meta.color}`,
            color: meta.color,
            fontFamily: fonts.mono,
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color }} />
          {meta.label}
        </Box>
      </Box>
      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontSize: 25,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
          color: colors.ink,
          mb: 0.8,
        }}
      >
        {station.label}
      </Typography>
      <Typography
        sx={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 14.5,
          fontWeight: 500,
          lineHeight: 1.45,
          color: colors.inkSoft,
        }}
      >
        {station.blurb}
      </Typography>
    </Box>
  );
}

function StationMarker({ station, index, status, selected, interactive, onSelect }) {
  const complete = status === 'complete';
  const current = status === 'current';
  return (
    <Box
      component="button"
      type="button"
      disabled={!interactive}
      aria-label={`${station.label} — ${STATUS_META[status].label}`}
      onClick={interactive ? onSelect : undefined}
      sx={{
        all: 'unset',
        cursor: interactive ? 'pointer' : 'default',
        position: 'absolute',
        left: `${station.x * 100}%`,
        top: `${station.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: selected ? 6 : 3,
        width: 26,
        height: 26,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: complete ? colors.green : current ? colors.orange : 'rgba(255,255,255,0.92)',
        border: complete || current ? 'none' : '1.5px solid var(--sand-300)',
        color: complete || current ? 'white' : colors.inkSoft,
        fontFamily: fonts.mono,
        fontSize: 11,
        fontWeight: 700,
        boxShadow: selected
          ? '0 0 0 4px rgba(255,255,255,0.92), 0 0 0 7px var(--orange)'
          : '0 2px 8px rgba(15,28,46,0.24)',
        transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms cubic-bezier(0.2,0.8,0.2,1)',
        '&:hover': interactive ? { transform: 'translate(-50%, -50%) scale(1.15)' } : undefined,
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
      }}
    >
      {complete ? '✓' : index + 1}
      {current && (
        <Box
          sx={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: '2px solid var(--orange)',
            opacity: 0.55,
            animation: 'journeyMarkerPulse 2.4s ease-out infinite',
            '@keyframes journeyMarkerPulse': {
              '0%': { transform: 'scale(0.9)', opacity: 0.55 },
              '70%': { transform: 'scale(1.5)', opacity: 0 },
              '100%': { transform: 'scale(1.5)', opacity: 0 },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              opacity: 0,
            },
          }}
        />
      )}
    </Box>
  );
}
