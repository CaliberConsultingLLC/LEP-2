import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import JourneyPorthole from './JourneyPorthole';
import { CONTENT_MAX_WIDTH_DEFAULT, CONTENT_PX } from './layoutConstants';
import {
  chapterText,
  getHeaderMetaForLocation,
  getJourneyIndexForLocation,
  JOURNEY_STATIONS,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, shadows, type } from '../styles/tokens';

export default function ProcessChapterHeader({
  compact = false,
  titleOverride = '',
  subtitleOverride = '',
  chapterIndex: chapterIndexOverride = null,
  metaOverride = undefined,
  contentMaxWidth = CONTENT_MAX_WIDTH_DEFAULT,
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

  return (
    <Box
      sx={{
        bgcolor: 'transparent',
        pt: compact ? { xs: 1.6, md: 2 } : { xs: 2, md: 2.5 },
      }}
    >
      <Box
        sx={{
          maxWidth: contentMaxWidth,
          mx: 'auto',
          px: CONTENT_PX,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2.5, md: '28px' },
            borderBottom: `1px solid ${colors.sand200}`,
            pb: '22px',
            mb: '34px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '26px', minWidth: 0, flex: 1 }}>
            {!compact && (
              <>
                <JourneyPorthole variant="header" chapterIndex={chapterIndex} />
                <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: colors.sand200, my: '4px', flexShrink: 0 }} />
              </>
            )}
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <Typography sx={type.eyebrow}>{renderEyebrow(chapterIndex, station)}</Typography>
              <Typography
                component="h1"
                sx={
                  compact
                    ? type.pageTitleCompact
                    : {
                        fontFamily: fonts.serif,
                        fontWeight: 500,
                        fontSize: { xs: 26, md: 30 },
                        letterSpacing: '-0.02em',
                        lineHeight: 1.12,
                        color: colors.ink,
                      }
                }
              >
                {titleOverride || station.title || station.label}
              </Typography>
              {!compact && (
                <Typography sx={type.subtitle}>
                  {subtitleOverride || station.subtitle || station.blurb}
                </Typography>
              )}
            </Box>
          </Box>
          {meta && renderMeta(meta)}
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

function renderMeta(meta) {
  if (React.isValidElement(meta)) return meta;
  if (meta && typeof meta === 'object') {
    return <HeaderMetaPlate meta={meta} />;
  }
  return null;
}

function HeaderMetaPlate({ meta }) {
  const label = String(meta.label || '').trim();
  const valueText = String(meta.value || '').trim();
  const parsed = valueText.match(/(\d+)\s*\/\s*(\d+)/);

  const parsedCurrent = Number.isFinite(Number(meta.current)) ? Number(meta.current) : null;
  const parsedTotal = Number.isFinite(Number(meta.total)) ? Number(meta.total) : null;
  const current = parsedCurrent ?? (parsed ? Number(parsed[1]) : null);
  const total = parsedTotal ?? (parsed ? Number(parsed[2]) : null);

  const hasFiniteCount = Number.isFinite(current) && Number.isFinite(total) && total > 0;
  const showPips = hasFiniteCount && total <= 8;
  const countText = hasFiniteCount ? `${current} / ${total}` : valueText;

  const countMatch = countText.match(/^(\d+)(.*)$/);
  const tailText = countMatch ? countMatch[2] : '';

  return (
    <Box
      sx={{
        flexShrink: 0,
        textAlign: 'right',
        bgcolor: colors.surface1,
        border: `1px solid ${colors.sand200}`,
        borderRadius: 'var(--cairn-radius-md)',
        px: '18px',
        py: '13px',
        boxShadow: shadows.card,
      }}
    >
      {label && (
        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: colors.inkSoft,
            mb: '10px',
          }}
        >
          {label}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
        {showPips &&
          Array.from({ length: total }, (_, idx) => {
            const active = idx < Math.min(current, total);
            return (
              <Box
                key={`meta-pip-${idx}`}
                sx={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  border: `1.5px solid ${active ? colors.orange : colors.sand300}`,
                  bgcolor: active ? colors.orange : 'transparent',
                  boxShadow: active ? '0 1px 4px rgba(224,122,63,0.4)' : 'none',
                }}
              />
            );
          })}

        <Typography
          sx={{
            fontFamily: fonts.mono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            ml: showPips ? '9px' : 0,
            whiteSpace: 'nowrap',
          }}
        >
          {countMatch ? (
            <>
              <Box component="span" sx={{ color: colors.orangeDeep }}>
                {countMatch[1]}
              </Box>
              <Box component="span" sx={{ color: colors.inkSoft }}>
                {tailText}
              </Box>
            </>
          ) : (
            <Box component="span" sx={{ color: colors.inkSoft }}>
              {countText || '—'}
            </Box>
          )}
        </Typography>
      </Box>
    </Box>
  );
}
