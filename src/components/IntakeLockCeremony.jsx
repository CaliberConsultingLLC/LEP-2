// The moment the intake stops being editable.
//
// Two beats on the approved chapter-ceremony shell — a sand card with the navy
// guide panel unfolded beside it. Beat one asks, because this is the last
// point where the answer can still be no. Beat two is the handoff into the
// reflection, and it is the only owl between locking and the summary: the
// journey gate for the `reflect` chapter is marked seen when this fires, so
// the leader does not meet the same bird twice.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { useGuide } from '../context/GuideContext';
import { getPersona } from '../data/guidePersonas';
import { guideImage } from '../data/guideArt';
import { colors, fonts, radii, shadows } from '../styles/tokens';

const CARD_W = 620;
const CARD_H = 320;
const PANEL_W = 250;
const MOBILE_MAX = 639;

// What the guide says as the record closes, in each voice. Short on purpose:
// this beat is a door, not a lesson.
const HANDOFF_LINES = {
  mentor: 'I have what you told me. Now I will tell you what I see — in four short parts. Nothing to choose yet. Just read it slowly enough to recognise yourself.',
  catalyst: 'Locked. That is the hard part done. What comes next is the good part — four short reads and you will know where you are starting from.',
  challenger: 'It is closed. You do not get to soften it now. Read what it says and see whether you already knew.',
  bestFriend: 'That is it — it is in. Come and read it with me. Four short parts, and none of them are trying to catch you out.',
  mother: 'It is safe now, and it is yours. Come and read what you said. Take it gently; there is no hurry in this part.',
  roaster: 'Sealed. No take-backs. Now let us go find out what you just admitted to, in four convenient instalments.',
};

function GuidePanel({ guideId, guideName }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
        bgcolor: colors.navy900,
        width: PANEL_W,
        height: CARD_H,
        [`@media (max-width: ${MOBILE_MAX}px)`]: { width: '100%', height: 170 },
      }}
    >
      <Box
        component="img"
        src={guideImage(guideId, 'lantern')}
        alt=""
        draggable={false}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '108%',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
      <Typography
        sx={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: colors.amberSoft,
        }}
      >
        {guideName}
      </Typography>
    </Box>
  );
}

export default function IntakeLockCeremony({ open, beat, onConfirm, onKeepReading, onRead, busy = false }) {
  const { personaId } = useGuide();
  const guide = getPersona(personaId);
  const guideId = guide?.id || 'mentor';
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!open || !mounted || typeof document === 'undefined') return null;

  const confirming = beat === 'confirm';

  return createPortal(
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        bgcolor: 'rgba(9,16,31,0.62)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          display: 'flex',
          overflow: 'hidden',
          borderRadius: radii.xl,
          boxShadow: '0 40px 90px rgba(9,16,31,0.4)',
          bgcolor: colors.sand50,
          width: 'min(100%, 620px)',
          flexDirection: 'column',
          [`@media (min-width: ${MOBILE_MAX + 1}px)`]: {
            flexDirection: 'row',
            width: CARD_W + PANEL_W,
            height: CARD_H,
          },
        }}
      >
        <Box sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: '26px 24px', md: '34px 38px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <Typography sx={{
            fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: colors.orangeDeep, mb: '12px',
          }}>
            {confirming ? 'The sign-off' : 'Chapter II · Locked ✓'}
          </Typography>

          <Typography sx={{
            fontFamily: fonts.serif, fontSize: { xs: 25, md: 30 }, fontWeight: 500,
            lineHeight: 1.12, letterSpacing: '-0.02em', color: colors.ink, mb: '14px',
          }}>
            {confirming ? 'This becomes the record.' : 'Reflect and Digest'}
          </Typography>

          {confirming ? (
            <Typography sx={{
              fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.6, color: colors.inkSoft, mb: '22px',
            }}>
              Everything after this — your reflection, your traits, your campaign — is read from
              the answers you just verified. They cannot be changed again.
            </Typography>
          ) : (
            <Box sx={{ borderLeft: `2px solid #e1af43`, pl: '16px', mb: '22px' }}>
              <Typography sx={{
                fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15.5,
                lineHeight: 1.5, color: colors.inkSoft,
              }}>
                {HANDOFF_LINES[guideId] || HANDOFF_LINES.mentor}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {confirming ? (
              <>
                <Box
                  component="button"
                  type="button"
                  onClick={busy ? undefined : onConfirm}
                  disabled={busy}
                  sx={{
                    all: 'unset', boxSizing: 'border-box',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    px: '26px', minHeight: 44, borderRadius: radii.pill,
                    bgcolor: colors.orange, color: '#fff',
                    fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700,
                    cursor: busy ? 'wait' : 'pointer',
                    opacity: busy ? 0.7 : 1,
                    boxShadow: '0 8px 24px rgba(224,122,63,.3)',
                    '&:hover': busy ? undefined : { transform: 'translateY(-1px)' },
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                >
                  {busy ? 'Locking…' : 'Lock it in'}
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={busy ? undefined : onKeepReading}
                  sx={{
                    all: 'unset', boxSizing: 'border-box',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    px: '22px', minHeight: 44, borderRadius: radii.pill,
                    border: `1px solid ${colors.sand300}`,
                    fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700,
                    color: colors.inkSoft, cursor: 'pointer',
                    '&:hover': { color: colors.ink, borderColor: colors.navy500 },
                    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                  }}
                >
                  Keep reading
                </Box>
              </>
            ) : (
              <Box
                component="button"
                type="button"
                onClick={onRead}
                sx={{
                  all: 'unset', boxSizing: 'border-box',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  px: '26px', minHeight: 44, borderRadius: radii.pill,
                  bgcolor: colors.navy900, color: colors.amberSoft,
                  fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700,
                  boxShadow: shadows.buttonPrimary, cursor: 'pointer',
                  '&:hover': { bgcolor: colors.navy800, transform: 'translateY(-1px)' },
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                Read your reflection
              </Box>
            )}
          </Box>
        </Box>

        <GuidePanel guideId={guideId} guideName={guide?.name || 'Mentor'} />
      </Box>
    </Box>,
    document.body
  );
}
