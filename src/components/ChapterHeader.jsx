import React, { useMemo, useRef, useState } from 'react';
import { Box, Tooltip, Typography, useMediaQuery } from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import CompassTopbar from './CompassTopbar';
import JourneyPorthole from './JourneyPorthole';
import JourneyMapModal from './JourneyMapModal';
import { auth } from '../firebase';
import {
  CHAPTER_TOTAL_ROMAN,
  chapterById,
  resolveFromLocation,
  stationIndexForChapter,
} from '../data/chapterMap';
import {
  getJourneyCompletion,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, radii } from '../styles/tokens';

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const shortLabel = (label = '') => String(label).trim().split(/\s+/)[0] || label;

/* Beat native <button> chrome. `all: unset` does not win on Windows browsers. */
const unstyledButton = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  border: 'none',
  boxShadow: 'none',
  margin: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  lineHeight: 'inherit',
  textAlign: 'inherit',
  '&::-moz-focus-inner': { border: 0, padding: 0 },
};

export function StatusChip({
  variant = 'sequence',
  label = '',
  current = 0,
  total = 0,
  status = '',
  saved = false,
}) {
  const safeTotal = Number(total) || 0;
  const safeCurrent = Math.max(0, Number(current) || 0);
  const progress = safeTotal > 0 ? Math.min(1, safeCurrent / safeTotal) : 0;
  const showDots = variant === 'sequence' && safeTotal > 0 && safeTotal <= 8;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: variant === 'intake' ? '12px' : '10px',
        padding: '7px 14px',
        borderRadius: radii.pill,
        bgcolor: colors.sand50,
        border: `1px solid ${colors.sand200}`,
        flexShrink: 0,
      }}
    >
      {label && (
        <Typography
          component="span"
          sx={{
            fontFamily: fonts.mono,
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.inkSoft,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Typography>
      )}
      {showDots && (
        <Box sx={{ display: 'flex', gap: '4px' }} aria-hidden>
          {Array.from({ length: safeTotal }, (_, idx) => {
            const on = idx < Math.min(safeCurrent, safeTotal);
            return (
              <Box
                key={`chip-dot-${idx}`}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: `1px solid ${on ? colors.orange : colors.sand300}`,
                  bgcolor: on ? colors.orange : 'transparent',
                }}
              />
            );
          })}
        </Box>
      )}
      {safeTotal > 0 && (
        <Typography
          component="span"
          sx={{
            fontFamily: fonts.mono,
            fontSize: 12,
            fontWeight: 700,
            color: colors.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {safeCurrent} / {safeTotal}
        </Typography>
      )}
      {variant === 'dashboard' && status && (
        <>
          <Box sx={{ width: '1px', height: 14, bgcolor: colors.sand200 }} aria-hidden />
          <Typography
            component="span"
            sx={{
              fontFamily: fonts.sans,
              fontSize: 11.5,
              fontWeight: 700,
              color: colors.green,
              whiteSpace: 'nowrap',
            }}
          >
            {status}
          </Typography>
        </>
      )}
      {variant === 'intake' && (
        <>
          <Box
            aria-hidden
            sx={{
              width: 92,
              height: 5,
              borderRadius: radii.pill,
              bgcolor: colors.sand100,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'block',
                width: `${Math.round(progress * 100)}%`,
                height: 5,
                bgcolor: colors.orange,
              }}
            />
          </Box>
          {saved && (
            <Typography
              component="span"
              sx={{
                fontFamily: fonts.sans,
                fontSize: 11.5,
                fontWeight: 700,
                color: colors.green,
                whiteSpace: 'nowrap',
              }}
            >
              Saved
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

function renderChip(chip) {
  if (!chip) return null;
  if (React.isValidElement(chip)) return chip;
  if (typeof chip === 'object') return <StatusChip {...chip} />;
  return null;
}

function stepState(step, index, activeIndex, stepStatus) {
  const override = stepStatus?.[step.id];
  if (override === 'locked' || override === 'done') return override;
  if (index === activeIndex) return 'active';
  if (index < activeIndex) return 'done';
  return 'upcoming';
}

export default function ChapterHeader({
  chapterId: chapterIdProp,
  activeStepId: activeStepIdProp,
  chip = null,
  stepStatus = {},
  onStepSelect,
  utilityOnly = false,
  // Drill-down mode. A page that owns a sub-selection — Evidence and its three
  // traits — hands the rail its own steps plus a way back out, and the rail
  // becomes that page's switcher instead of the chapter's tab strip. The
  // chapter's own steps are unreachable while drilled in; `backAction` is the
  // way up, which is why it renders as a distinct control rather than a step.
  steps: stepsProp = null,
  backAction = null,
  // The dashboard rail is a set of rooms you move between, not a checklist you
  // burn down: a tick there reads as "closed", which is the wrong word for a
  // room you are meant to come back to. `markers="number"` keeps the circle and
  // drops the tick, and `dividerAfterId` sets Basecamp — where you stand —
  // apart from the four rooms you go and look at.
  markers = 'auto',
  dividerAfterId = null,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const compact = useMediaQuery('(max-width:900px)', { noSsr: true });
  const slimTabs = useMediaQuery('(max-width:1280px)', { noSsr: true });
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });

  const inferred = useMemo(
    () => resolveFromLocation(location.pathname, location.search),
    [location.pathname, location.search]
  );
  const chapterId = chapterIdProp || inferred?.chapterId;
  const activeStepId = activeStepIdProp || inferred?.activeStepId;
  const chapter = chapterById(chapterId);
  const steps = stepsProp || chapter?.steps || [];
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === activeStepId));
  const stationIndex = stationIndexForChapter(chapterId);

  // `?map=1` opens the journey folio straight from a link, so the page catalog
  // can point at it the way it points at every other surface.
  const [mapOpen, setMapOpen] = useState(
    () => new URLSearchParams(location.search || '').get('map') === '1'
  );

  const closeMap = () => {
    setMapOpen(false);
    const params = new URLSearchParams(location.search || '');
    if (!params.has('map')) return;
    params.delete('map');
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
  };
  const portholeBtnRef = useRef(null);

  const { firstName, completion } = useMemo(() => {
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const name = String(userInfo?.name || auth?.currentUser?.displayName || '').trim();
    return {
      firstName: name.split(/\s+/)[0] || '',
      completion: getJourneyCompletion(),
    };
  }, [location.pathname]);


  const openMap = () => setMapOpen(true);

  const handleStepClick = (step, status) => {
    if (status === 'locked') return;
    if (onStepSelect) {
      onStepSelect(step);
      return;
    }
    if (step?.path) navigate(step.path);
  };

  if (utilityOnly || !chapter) {
    return <CompassTopbar />;
  }

  const portholeSize = compact ? 72 : 100;
  const railPadLeft = compact ? 108 : 152;
  const portholeTop = compact ? -26 : -38;

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        width: '100%',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      <CompassTopbar embedded />
      <Box
        sx={{
          position: 'relative',
          zIndex: 3,
          height: 78,
          display: 'flex',
          alignItems: 'center',
          padding: `0 28px 0 ${railPadLeft}px`,
          bgcolor: colors.surface1,
          borderBottom: `1px solid ${colors.sand200}`,
          overflow: 'visible',
        }}
      >
        {/* The lens is the door to the map, and nothing else. It used to drop
            the chapter drawer, which meant the one thing on screen that looks
            like a map opened a panel of text instead. Now it opens the map.
            The tooltip and the lift on hover are the only thing telling you it
            is a control at all — the art gives no other clue. */}
        <Tooltip title="Open your journey map" arrow placement="bottom-start">
          <Box
            component="button"
            type="button"
            ref={portholeBtnRef}
            onClick={openMap}
            aria-haspopup="dialog"
            aria-label="Open your journey map"
            className="chapter-header-control"
            sx={{
              ...unstyledButton,
              position: 'absolute',
              left: 28,
              top: portholeTop,
              zIndex: 3,
              cursor: 'pointer',
              borderRadius: '50%',
              lineHeight: 0,
              transition: reduceMotion ? 'none' : 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), filter 180ms',
              '&:hover': { transform: 'scale(1.045)', filter: 'brightness(1.06)' },
              '&:active': { transform: 'scale(0.99)' },
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3 },
            }}
          >
            <JourneyPorthole variant="corner" size={portholeSize} chapterIndex={stationIndex} />
          </Box>
        </Tooltip>

        <Box
          component="button"
          type="button"
          onClick={openMap}
          aria-label="Open your journey map"
          className="chapter-header-control"
          sx={{
            ...unstyledButton,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            flexShrink: 0,
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3, borderRadius: radii.sm },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: fonts.mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.orangeDeep,
            }}
          >
            {`Chapter ${chapter.num} of ${CHAPTER_TOTAL_ROMAN}`}
          </Box>
          <Typography
            component="span"
            sx={{
              fontFamily: fonts.serif,
              fontWeight: 500,
              fontSize: 21,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: colors.ink,
              whiteSpace: 'nowrap',
            }}
          >
            {chapter.name}
          </Typography>
        </Box>

        <Box sx={{ width: '1px', height: 34, bgcolor: colors.sand200, mx: '22px', flexShrink: 0 }} aria-hidden />

        {/* The way up, out of a drill-down. Same type as the step tabs beside
            it so it reads as part of the same row, but boxed so it is clearly
            a way out rather than another step. Quiet on purpose — it should be
            findable, not competing with the trait you are reading. */}
        {backAction ? (
          <Box
            component="button"
            type="button"
            className="chapter-header-control"
            onClick={backAction.onClick}
            sx={{
              ...unstyledButton,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              px: '14px',
              height: 34,
              mr: '18px',
              flexShrink: 0,
              cursor: 'pointer',
              borderRadius: radii.pill,
              border: `1px solid ${colors.sand300}`,
              bgcolor: colors.surface1,
              color: colors.navy600,
              transition: 'border-color 140ms, color 140ms, background 140ms',
              '&:hover': {
                borderColor: colors.navy500,
                color: colors.navy900,
                bgcolor: colors.sand50,
              },
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            <Box component="span" aria-hidden sx={{ fontSize: 13, lineHeight: 1 }}>←</Box>
            <Typography
              component="span"
              sx={{
                fontFamily: fonts.sans,
                fontSize: 13.5,
                fontWeight: 600,
                color: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {backAction.label || 'Dashboard'}
            </Typography>
          </Box>
        ) : null}

        {compact ? (
          <Box
            component="button"
            type="button"
            onClick={openMap}
            aria-label="Open your journey map"
            className="chapter-header-control"
            sx={{
              ...unstyledButton,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: fonts.sans,
              fontSize: 13.5,
              fontWeight: 700,
              color: colors.ink,
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3, borderRadius: radii.sm },
            }}
          >
            {`Step ${activeIndex + 1} of ${steps.length}`}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', height: 78, flexShrink: 0 }}>
            {steps.map((step, index) => {
              const status = stepState(step, index, activeIndex, stepStatus);
              const locked = status === 'locked';
              const active = status === 'active';
              const done = status === 'done';
              const tab = (
                <Box
                  key={step.id}
                  component="button"
                  type="button"
                  className="chapter-header-control"
                  disabled={locked}
                  aria-current={active ? 'step' : undefined}
                  aria-disabled={locked || undefined}
                  onClick={() => handleStepClick(step, status)}
                  sx={{
                    ...unstyledButton,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: locked ? '7px' : '9px',
                    padding: '0 18px',
                    height: 78,
                    flexShrink: 0,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    // Only a locked room is dimmed. A room you have not opened
                    // yet is still a place you can go, and greying it said the
                    // opposite of that across the whole strip.
                    opacity: locked ? 0.45 : 1,
                    borderRadius: 0,
                    boxShadow: active ? `inset 0 -2px 0 ${colors.orange}` : 'none',
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: -4 },
                  }}
                >
                  {!slimTabs && (
                  <Box
                    aria-hidden
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: done && markers !== 'number' ? fonts.sans : fonts.mono,
                      fontSize: done && markers !== 'number' ? 9 : 8.5,
                      fontWeight: 700,
                      bgcolor: active ? colors.orange : (done && markers !== 'number') ? colors.green : 'transparent',
                      border: `1px solid ${active ? colors.orange : done ? colors.green : colors.sand300}`,
                      color: active
                        ? 'var(--dial-node-fill)'
                        : done
                          ? (markers === 'number' ? colors.green : 'var(--dial-node-fill)')
                          : colors.ink,
                    }}
                  >
                    {done && markers !== 'number' ? '✓' : index + 1}
                  </Box>
                  )}
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: fonts.sans,
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 600,
                      color: colors.ink,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {slimTabs ? (step.shortLabel || shortLabel(step.label)) : step.label}
                  </Typography>
                  {locked && (
                    <LockOutlined aria-label="Locked" sx={{ fontSize: 10, color: colors.inkSoft }} />
                  )}
                </Box>
              );
              if (step.id !== dividerAfterId) return tab;
              return (
                <React.Fragment key={`${step.id}-group`}>
                  {tab}
                  {/* Short on purpose — a full-height rule would cut the row in
                      two. This only has to say that what is behind it is where
                      you stand, and what is ahead of it is where you look. */}
                  <Box
                    aria-hidden
                    sx={{ width: '1px', height: 26, bgcolor: colors.sand300, mx: '10px', flexShrink: 0, alignSelf: 'center' }}
                  />
                </React.Fragment>
              );
            })}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 12 }} />
        {renderChip(chip)}
      </Box>

      <JourneyMapModal
        open={mapOpen}
        currentIndex={stationIndex}
        firstName={firstName}
        completion={completion}
        onClose={closeMap}
      />
    </Box>
  );
}
