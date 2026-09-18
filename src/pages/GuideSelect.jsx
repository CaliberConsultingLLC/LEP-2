import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '../context/GuideContext';
import { SELECTABLE_GUIDE_PERSONAS } from '../data/guidePersonas';
import { guideImage } from '../data/guideArt';
import { getGuideAnchor } from '../data/guideAnchors.generated';
import CompassLayout from '../components/CompassLayout';
import ProcessTopRail from '../components/ProcessTopRail';
import { buttons, colors, fonts, radii, shadows, surfaces, type } from '../styles/tokens';
import { isIntakeUnlocked, refreshEntitlement } from '../utils/billing';
import { isDemoSession } from '../utils/demoMode';

// The picture each guide is chosen by — the pose that says who they are,
// rather than the same wings-up greeting on all six.
const CAROUSEL_POSE = {
  mentor: 'idle',          // mug in hand, settled: warm and grounded
  catalyst: 'point',       // already pointing at what is next
  challenger: 'armsCross', // arms folded, not letting you off
  bestFriend: 'sign',      // "You got this!"
  mother: 'armsCross',     // wings folded, the knowing look
  roaster: 'armsCross',    // the shrug the landing page uses for it too
};

// How much of the bird the frame shows, from the top of the head down. The
// rest is the lower branch — the owl reads bigger and closer without being
// cropped to a face.
const VISIBLE = 0.8;

// The card's picture, framed off the art rather than a fixed crop: centred
// between the head and the body, because the birds lean and a crop centred on
// the square leaves some of them half out of frame.
function framedImage(src) {
  const { box, face } = getGuideAnchor(src);
  const cx = ((box[0] + box[2]) / 2 + (face[0] + face[2]) / 2) / 2;
  return {
    position: 'absolute',
    top: 0,
    left: '50%',
    height: `${(100 / VISIBLE).toFixed(2)}%`,
    width: 'auto',
    maxWidth: 'none',
    transform: `translateX(-${(cx * 100).toFixed(2)}%)`,
    display: 'block',
  };
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function GuideSelect() {
  const navigate = useNavigate();
  const { personaId, setPersona, hasSelectedGuide } = useGuide();
  const guides = SELECTABLE_GUIDE_PERSONAS;
  const initialIndex = Math.max(0, guides.findIndex((p) => p.id === personaId && hasSelectedGuide));
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const active = guides[activeIndex] || guides[0];

  // The carousel takes whatever height the header and the Continue row leave
  // it, and the cards are sized off that — so the owls are as large as the
  // window allows and Continue is never the part that falls off the bottom.
  // The frame is the room minus the centre card's own text, which is measured
  // because a guide's description runs to one line or two.
  const stageRef = useRef(null);
  const textRef = useRef(null);
  const [room, setRoom] = useState({ h: 400, text: 118 });
  useLayoutEffect(() => {
    const read = () => setRoom({
      h: stageRef.current?.clientHeight || 400,
      text: textRef.current?.offsetHeight || 118,
    });
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    if (ro) {
      if (stageRef.current) ro.observe(stageRef.current);
      if (textRef.current) ro.observe(textRef.current);
    }
    return () => ro?.disconnect();
  }, [activeIndex]);
  const frame = Math.round(clamp(room.h - room.text - 16, 120, 330));
  const cardW = Math.round(clamp(frame * 1.25, 330, 410));
  const sideFrame = Math.round(frame * 0.64);
  const sideW = Math.round(cardW * 0.66);
  const canBegin = hasSelectedGuide && guides.some((p) => p.id === personaId);

  // Guide selection sits behind the paywall.
  //
  // The cached flag is an optimistic yes, never a no. It lives in this
  // browser's localStorage, so a leader who paid on another device — or who
  // just signed in on a clean one — arrives with nothing cached and would be
  // bounced to a door they have already paid through. Only the server's no
  // sends anyone back; until it answers, the page holds rather than renders,
  // so an unpaid visitor still never sees what is behind it.
  const [payGate, setPayGate] = useState(
    () => (isDemoSession() || isIntakeUnlocked() ? 'allowed' : 'checking')
  );

  useEffect(() => {
    if (isDemoSession()) return undefined;
    let cancelled = false;
    refreshEntitlement().then((allowed) => {
      if (cancelled) return;
      if (allowed) setPayGate('allowed');
      else navigate('/pay', { replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    const centered = guides[activeIndex];
    if (centered) setPersona(centered.id);
  }, [activeIndex, guides, setPersona]);

  const visible = useMemo(() => {
    const count = SELECTABLE_GUIDE_PERSONAS.length;
    const left = (activeIndex - 1 + count) % count;
    const right = (activeIndex + 1) % count;
    return [
      { persona: SELECTABLE_GUIDE_PERSONAS[left], slot: 'left', index: left },
      { persona: SELECTABLE_GUIDE_PERSONAS[activeIndex], slot: 'center', index: activeIndex },
      { persona: SELECTABLE_GUIDE_PERSONAS[right], slot: 'right', index: right },
    ];
  }, [activeIndex]);

  const handleSelectIndex = (index) => {
    const persona = guides[index];
    if (!persona) return;
    setActiveIndex(index);
    setPersona(persona.id);
  };

  const handleBegin = () => {
    if (!canBegin) return;
    navigate('/form?stage=profile');
  };

  const step = (delta) => {
    const next = (activeIndex + delta + guides.length) % guides.length;
    handleSelectIndex(next);
  };

  const chevronSx = {
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    position: 'absolute',
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: radii.circle,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1.5px solid ${colors.sand300}`,
    bgcolor: colors.surface1,
    color: colors.inkSoft,
    '&:hover': { borderColor: colors.orange, color: colors.navy900 },
    '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
  };

  if (payGate === 'checking') return null;

  return (
    <Box sx={{
      // A height, not a min and max: the carousel fills what is left of it,
      // and "what is left" only exists if the page's own height is definite.
      height: '100svh',
      bgcolor: colors.sand50,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ProcessTopRail
        chapterId="profile"
        activeStepId="guide"
        chip={{ variant: 'sequence', label: 'Step', current: 2, total: 3 }}
      />

      <CompassLayout viewportFit contentMaxWidth={1180}>
        <Box sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 0,
        }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 1.5, md: 2 }, flexShrink: 0, px: 1 }}>
            <Typography sx={{ ...type.eyebrow, mb: 1 }}>Leader profile</Typography>
            <Typography sx={{ ...type.question, mb: 0.75 }}>Choose your guide</Typography>
            <Typography sx={{ ...type.subtitle, mx: 'auto', maxWidth: '76ch' }}>
              Your guide delivers everything Compass has to tell you, and some of it will be hard to hear.
              Choose the voice you will actually listen to when it is — the approach that lands with you
              and is good for you, not just the one that sounds like you.
            </Typography>
          </Box>

          <Box ref={stageRef} sx={{
            position: 'relative',
            width: '100%',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: { xs: 1.5, md: 2 },
          }}>
            <Box
              component="button"
              type="button"
              aria-label="Previous guide"
              onClick={() => step(-1)}
              sx={{ ...chevronSx, left: { xs: 0, md: 8 } }}
            >
              <ChevronLeftIcon />
            </Box>

            <Box sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1200px',
            }}>
              {visible.map(({ persona, slot, index }) => {
                const isCenter = slot === 'center';
                const selected = personaId === persona.id;
                const src = guideImage(persona.id, CAROUSEL_POSE[persona.id] || 'idle');
                return (
                  <Box
                    key={`${persona.id}-${slot}`}
                    component="button"
                    type="button"
                    onClick={() => handleSelectIndex(index)}
                    sx={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      position: 'absolute',
                      width: isCenter ? cardW : sideW,
                      transform: isCenter
                        ? 'translateX(0) scale(1)'
                        : slot === 'left'
                          ? 'translateX(-112%) scale(0.78)'
                          : 'translateX(112%) scale(0.78)',
                      opacity: isCenter ? 1 : 0.42,
                      filter: isCenter ? 'none' : 'saturate(0.7)',
                      zIndex: isCenter ? 3 : 1,
                      transition: 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease, filter 280ms ease',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'inherit',
                      color: 'inherit',
                      p: 0,
                      ...(isCenter ? surfaces.card : surfaces.cardFlat),
                      borderRadius: radii.lg,
                      border: `2px solid ${selected ? persona.accent : colors.sand200}`,
                      boxShadow: isCenter ? shadows.card : shadows.none,
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ height: 5, bgcolor: persona.accent, width: '100%', flexShrink: 0 }} />
                    <Box sx={{
                      height: isCenter ? frame : sideFrame,
                      bgcolor: colors.surface2,
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      <Box component="img" src={src} alt={persona.name} sx={framedImage(src)} />
                    </Box>
                    <Box
                      ref={isCenter ? textRef : undefined}
                      sx={{ p: isCenter ? '14px 16px 12px' : '10px 12px 10px', textAlign: 'center' }}
                    >
                      <Typography sx={{
                        fontFamily: fonts.serif,
                        fontWeight: 500,
                        fontSize: isCenter ? { xs: 20, md: 22 } : 15,
                        letterSpacing: '-0.02em',
                        color: colors.ink,
                        mb: isCenter ? 0.5 : 0,
                      }}>
                        {persona.name}
                      </Typography>
                      {isCenter && (
                        <>
                          <Typography sx={{
                            ...type.body,
                            fontStyle: 'italic',
                            color: colors.inkSoft,
                            mb: 0.5,
                          }}>
                            {persona.tagline}
                          </Typography>
                          <Typography sx={type.bodyMuted}>
                            {persona.voice}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box
              component="button"
              type="button"
              aria-label="Next guide"
              onClick={() => step(1)}
              sx={{ ...chevronSx, right: { xs: 0, md: 8 } }}
            >
              <ChevronRightIcon />
            </Box>
          </Box>

          <Stack spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button
              onClick={handleBegin}
              disabled={!canBegin}
              sx={{
                ...buttons.primary,
                opacity: canBegin ? 1 : 0.5,
              }}
            >
              Continue with {active.name}
            </Button>
            <Typography sx={{ ...type.bodyMuted, textAlign: 'center' }}>
              You can change your guide at any time after you begin.
            </Typography>
          </Stack>
        </Box>
      </CompassLayout>
    </Box>
  );
}

export default GuideSelect;
