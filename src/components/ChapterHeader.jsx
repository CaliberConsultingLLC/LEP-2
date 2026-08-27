import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import CompassTopbar from './CompassTopbar';
import JourneyPorthole from './JourneyPorthole';
import JourneyMapModal from './JourneyMapModal';
import { auth } from '../firebase';
import {
  CHAPTER_TOTAL,
  chapterById,
  chapterIndexOf,
  resolveFromLocation,
} from '../data/chapterMap';
import {
  getJourneyCompletion,
} from '../pages/Dashboard/journey/journeyModel.js';
import { colors, fonts, radii } from '../styles/tokens';

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const shortLabel = (label = '') => String(label).trim().split(/\s+/)[0] || label;

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
          <Box sx={{ width: 1, height: 14, bgcolor: colors.sand200 }} aria-hidden />
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
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const compact = useMediaQuery('(max-width:900px)');
  const slimTabs = useMediaQuery('(max-width:1180px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const inferred = useMemo(
    () => resolveFromLocation(location.pathname, location.search),
    [location.pathname, location.search]
  );
  const chapterId = chapterIdProp || inferred?.chapterId;
  const activeStepId = activeStepIdProp || inferred?.activeStepId;
  const chapter = chapterById(chapterId);
  const steps = chapter?.steps || [];
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === activeStepId));
  const activeStep = steps[activeIndex] || steps[0];
  const chapterIndex = chapterIndexOf(chapterId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const panelRef = useRef(null);
  const chapterBtnRef = useRef(null);
  const portholeBtnRef = useRef(null);
  const mobileStepRef = useRef(null);
  const lastTriggerRef = useRef(null);
  const wasOpenRef = useRef(false);

  const { firstName, completion } = useMemo(() => {
    const userInfo = parseJson(localStorage.getItem('userInfo'), {});
    const name = String(userInfo?.name || auth?.currentUser?.displayName || '').trim();
    return {
      firstName: name.split(/\s+/)[0] || '',
      completion: getJourneyCompletion(),
    };
  }, [location.pathname]);

  const atYearStart = chapterIndex === 0 && !completion[1];

  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = (triggerRef) => {
    lastTriggerRef.current = triggerRef?.current || null;
    setDrawerOpen((open) => !open);
  };

  useEffect(() => {
    if (drawerOpen) {
      wasOpenRef.current = true;
      panelRef.current?.focus();
      return undefined;
    }
    if (wasOpenRef.current && lastTriggerRef.current) {
      lastTriggerRef.current.focus();
    }
    wasOpenRef.current = false;
    return undefined;
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeDrawer();
    };
    const onDown = (event) => {
      const target = event.target;
      if (panelRef.current?.contains(target)) return;
      if (chapterBtnRef.current?.contains(target)) return;
      if (portholeBtnRef.current?.contains(target)) return;
      if (mobileStepRef.current?.contains(target)) return;
      closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [drawerOpen]);

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
        <Box
          component="button"
          type="button"
          ref={portholeBtnRef}
          onClick={() => toggleDrawer(portholeBtnRef)}
          aria-expanded={drawerOpen}
          aria-controls="chapter-overview"
          aria-label="Open chapter overview"
          sx={{
            all: 'unset',
            position: 'absolute',
            left: 28,
            top: portholeTop,
            zIndex: 3,
            cursor: 'pointer',
            borderRadius: '50%',
            lineHeight: 0,
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 3 },
          }}
        >
          <JourneyPorthole variant="corner" size={portholeSize} chapterIndex={chapterIndex} />
        </Box>

        <Box
          component="button"
          type="button"
          ref={chapterBtnRef}
          onClick={() => toggleDrawer(chapterBtnRef)}
          aria-expanded={drawerOpen}
          aria-controls="chapter-overview"
          sx={{
            all: 'unset',
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
            {`Chapter ${chapter.num} of ${romanTotal(CHAPTER_TOTAL)}`}
            <Box
              component="span"
              aria-hidden
              sx={{
                fontSize: 10,
                lineHeight: 1,
                color: drawerOpen ? colors.orange : colors.inkSoft,
              }}
            >
              {drawerOpen ? '▴' : '▾'}
            </Box>
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

        <Box sx={{ width: 1, height: 34, bgcolor: colors.sand200, mx: '22px', flexShrink: 0 }} aria-hidden />

        {compact ? (
          <Box
            component="button"
            type="button"
            ref={mobileStepRef}
            onClick={() => toggleDrawer(mobileStepRef)}
            aria-expanded={drawerOpen}
            aria-controls="chapter-overview"
            sx={{
              all: 'unset',
              cursor: 'pointer',
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
          <Box sx={{ display: 'flex', alignItems: 'center', height: 78, minWidth: 0 }}>
            {steps.map((step, index) => {
              const status = stepState(step, index, activeIndex, stepStatus);
              const locked = status === 'locked';
              const active = status === 'active';
              const done = status === 'done';
              return (
                <Box
                  key={step.id}
                  component="button"
                  type="button"
                  disabled={locked}
                  aria-current={active ? 'step' : undefined}
                  aria-disabled={locked || undefined}
                  onClick={() => handleStepClick(step, status)}
                  sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: locked ? '7px' : '9px',
                    padding: '0 18px',
                    height: 78,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.45 : active ? 1 : 0.6,
                    borderBottom: active ? `2px solid ${colors.orange}` : '2px solid transparent',
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
                      fontFamily: done ? fonts.sans : fonts.mono,
                      fontSize: done ? 9 : 8.5,
                      fontWeight: 700,
                      bgcolor: active ? colors.orange : done ? colors.green : 'transparent',
                      border: `1px solid ${active ? colors.orange : done ? colors.green : colors.sand300}`,
                      color: active || done ? 'var(--dial-node-fill)' : colors.inkSoft,
                    }}
                  >
                    {done ? '✓' : index + 1}
                  </Box>
                  )}
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: fonts.sans,
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 600,
                      color: active ? colors.ink : colors.inkSoft,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {slimTabs ? shortLabel(step.label) : step.label}
                  </Typography>
                  {locked && (
                    <LockOutlined aria-label="Locked" sx={{ fontSize: 10, color: colors.inkSoft }} />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        <Box sx={{ flex: 1 }} />
        {renderChip(chip)}
      </Box>

      {drawerOpen && (
        <Box
          id="chapter-overview"
          ref={panelRef}
          role="region"
          aria-label="Chapter overview"
          tabIndex={-1}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            zIndex: 5,
            bgcolor: colors.navy950,
            borderBottom: '1px solid rgba(244,206,161,0.2)',
            boxShadow: '0 24px 48px rgba(9,16,31,0.3)',
            outline: 'none',
            animation: reduceMotion ? 'none' : 'chapterDrawerDropIn 240ms cubic-bezier(0.2,0.8,0.2,1) both',
            '@keyframes chapterDrawerDropIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box
            sx={{
              padding: { xs: `22px 24px 24px ${railPadLeft}px`, md: `26px 44px 30px ${railPadLeft}px` },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1fr) 272px' },
              gap: { xs: '22px', md: '40px' },
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: colors.orange,
                  mb: '11px',
                }}
              >
                What this chapter is for
              </Typography>
              <Typography
                sx={{
                  fontFamily: fonts.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 15.5,
                  lineHeight: 1.55,
                  color: colors.sand200,
                  maxWidth: '46ch',
                }}
              >
                {chapter.purpose}
              </Typography>
            </Box>

            <Box
              sx={{
                borderLeft: { md: '1px solid rgba(244,206,161,0.14)' },
                pl: { md: '30px' },
              }}
            >
              <Typography
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'color-mix(in srgb, var(--amber-soft) 60%, transparent)',
                  mb: '12px',
                }}
              >
                What happens here
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {(activeStep?.whatHappens || []).slice(0, 3).map((fragment) => (
                  <Box key={fragment} sx={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Box
                      aria-hidden
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        bgcolor: colors.orange,
                        mt: '6px',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: fonts.sans,
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1.45,
                        color: colors.sand100,
                      }}
                    >
                      {fragment}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                borderLeft: { md: '1px solid rgba(244,206,161,0.14)' },
                pl: { md: '30px' },
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <Typography
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'color-mix(in srgb, var(--amber-soft) 60%, transparent)',
                }}
              >
                {`Chapter ${chapter.num} of ${romanTotal(CHAPTER_TOTAL)}`}
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={() => setMapOpen(true)}
                aria-haspopup="dialog"
                aria-label="Review the map"
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  position: 'relative',
                  height: 112,
                  borderRadius: radii.sm,
                  overflow: 'hidden',
                  border: '1px solid rgba(244,206,161,0.22)',
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url(/journey-base.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: '44% 62%',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(9,16,31,0.1), rgba(9,16,31,0.82))',
                  }}
                />
                <Typography
                  sx={{
                    position: 'absolute',
                    left: 14,
                    bottom: 12,
                    fontFamily: fonts.mono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: colors.amberSoft,
                  }}
                >
                  Review the map
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <JourneyMapModal
        open={mapOpen}
        mode="reference"
        currentIndex={chapterIndex}
        firstName={firstName}
        completion={completion}
        startOfYear={atYearStart}
        onClose={() => setMapOpen(false)}
      />
    </Box>
  );
}

function romanTotal(total) {
  const map = { 7: 'VII', 9: 'IX' };
  return map[total] || String(total);
}
