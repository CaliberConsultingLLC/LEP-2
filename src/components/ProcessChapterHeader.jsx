import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import JourneyPorthole from './JourneyPorthole';
import {
  chapterText,
  getHeaderMetaForLocation,
  getJourneyIndexForLocation,
  JOURNEY_STATIONS,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, type } from '../styles/tokens';

export default function ProcessChapterHeader({
  compact = false,
  titleOverride = '',
  subtitleOverride = '',
  chapterIndex: chapterIndexOverride = null,
  metaOverride = undefined,
}) {
  const location = useLocation();
  const { chapterIndex, station, meta } = useMemo(() => {
    const chapterIndex = Number.isInteger(chapterIndexOverride)
      ? chapterIndexOverride
      : getJourneyIndexForLocation(location.pathname, location.search);
    return {
      chapterIndex,
      station: JOURNEY_STATIONS[chapterIndex] || JOURNEY_STATIONS[0],
      meta: metaOverride !== undefined ? metaOverride : getHeaderMetaForLocation(location.pathname, location.search),
    };
  }, [chapterIndexOverride, location.pathname, location.search, metaOverride]);

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2.5,
          pb: 1.5,
          mb: 2.5,
          maxWidth: 880,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...type.eyebrow, mb: 0.7 }}>
            {renderEyebrow(chapterIndex, station)}
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: '-0.02em',
              lineHeight: 1.12,
              color: colors.ink,
            }}
          >
            {titleOverride || station.title || station.label}
          </Typography>
        </Box>
        {meta && (
          <HeaderMeta label={meta.label} value={meta.value} />
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'transparent',
      }}
    >
      <Box
        sx={{
          maxWidth: 880,
          minWidth: 880,
          mx: 'auto',
          px: 0,
          pt: 0,
          pb: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            gap: '28px',
            mb: '30px',
          }}
        >
          <JourneyPorthole chapterIndex={chapterIndex} />
          <Box sx={{ minWidth: 0, flex: 1, pr: meta ? '150px' : 0 }}>
            <Typography sx={{ ...type.eyebrow, mb: 0.9 }}>
              {renderEyebrow(chapterIndex, station)}
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: fonts.serif,
                fontWeight: 500,
                fontSize: { xs: 26, md: 30 },
                letterSpacing: '-0.02em',
                lineHeight: 1.12,
                color: colors.ink,
                mb: 0.9,
              }}
            >
              {titleOverride || station.title || station.label}
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.serif,
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 15.5,
                lineHeight: 1.45,
                color: colors.inkSoft,
                maxWidth: '52ch',
              }}
            >
              {subtitleOverride || station.subtitle || station.blurb}
            </Typography>
          </Box>
          {meta && (
            <Box sx={{ position: 'absolute', top: '26px', right: 0 }}>
              <HeaderMeta label={meta.label} value={meta.value} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function renderEyebrow(chapterIndex, station) {
  return (
    <>
      {chapterText(chapterIndex)}
      <Box component="span" sx={{ color: 'var(--sand-300)', mx: 0.5 }}>
        ·
      </Box>
      {station.label}
    </>
  );
}

function HeaderMeta({ label, value }) {
  const valueText = String(value || '');
  const match = valueText.match(/^(\d+)(.*)$/);

  return (
    <Box
      sx={{
        whiteSpace: 'nowrap',
        fontFamily: fonts.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: colors.inkSoft,
      }}
    >
      {label}{' '}
      <Box component="span" sx={{ color: colors.orangeDeep }}>
        {match ? match[1] : valueText}
      </Box>
      {match ? match[2] : ''}
    </Box>
  );
}
