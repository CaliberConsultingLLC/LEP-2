import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import JourneyPorthole from './JourneyPorthole';
import {
  chapterEyebrow,
  getHeaderMetaForLocation,
  getJourneyIndexForLocation,
  JOURNEY_STATIONS,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, radii, type } from '../styles/tokens';

export default function ProcessChapterHeader({ compact = false, titleOverride = '' }) {
  const location = useLocation();
  const { chapterIndex, station, meta } = useMemo(() => {
    const chapterIndex = getJourneyIndexForLocation(location.pathname, location.search);
    return {
      chapterIndex,
      station: JOURNEY_STATIONS[chapterIndex] || JOURNEY_STATIONS[0],
      meta: getHeaderMetaForLocation(location.pathname, location.search),
    };
  }, [location.pathname, location.search]);

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2.5,
          borderBottom: '1px solid var(--sand-200)',
          pb: 2,
          mb: 3.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...type.eyebrow, mb: 0.7 }}>
            {chapterEyebrow(chapterIndex)}
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
            {titleOverride || station.label}
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
        bgcolor: colors.surface2,
        borderBottom: '1px solid var(--sand-200)',
      }}
    >
      <Box
        sx={{
          maxWidth: 1180,
          mx: 'auto',
          px: { xs: 2.4, md: 5 },
          pt: { xs: 3, md: 3.5 },
          pb: { xs: 2.5, md: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 2.2, md: '28px' },
            mb: '30px',
          }}
        >
          <JourneyPorthole chapterIndex={chapterIndex} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...type.eyebrow, mb: 0.9 }}>
              {chapterEyebrow(chapterIndex)}
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
              {titleOverride || station.label}
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
              {station.blurb}
            </Typography>
          </Box>
          {meta && (
            <Box sx={{ display: { xs: 'none', md: 'block' }, alignSelf: 'center' }}>
              <HeaderMeta label={meta.label} value={meta.value} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function HeaderMeta({ label, value }) {
  return (
    <Box
      sx={{
        borderRadius: radii.pill,
        border: '1px solid var(--sand-200)',
        px: 1.5,
        py: 0.85,
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
        {value}
      </Box>
    </Box>
  );
}
