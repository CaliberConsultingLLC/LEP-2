// The last thing said before there is money in it.
//
// This used to be the front door: a full-bleed panel that opened the moment
// someone landed on /user-info, before they had typed a character. That put
// the terms of the thing in front of a stranger — no name, no email, nothing
// logged — and asked them to agree to it. Whoever walked away from that page
// walked away leaving us nothing at all.
//
// So it moved one step later. The form is now the first thing on the screen,
// and this is what happens when they press the button on it: the page behind
// dims, the card steps in, and the account is created from in here. The
// account exists either way once they agree, and nobody has paid yet — the
// expectations land in the gap between the email being logged and the card
// coming out.
//
// Its job is fit, not a tour. Someone reading this should be able to tell
// whether they are a good candidate before they pay: it asks for candour, it
// needs at least three people they lead directly, and what it learns is theirs
// alone. What comes back is left for later on purpose — promising a result
// here is selling, and this is the one screen that should not be.
//
// The guide stands where every interruption's guide stands — full height,
// anchored bottom-left, on the same frame and perch GuidePortrait uses. The
// words are a card centred in the window rather than a bubble off its beak:
// a bubble is tethered to the head, so it could never sit in the middle of
// the screen, and the middle is where the eye should be for this one.
//
// No guide has been chosen yet, because that happens after payment. This uses
// the house guide, and the copy is written to be true in any voice.
//
// The fit check is the guide's; the two boxes under it are the lawyer's, worded
// exactly as the checkout-consent handoff specifies. The card is the delivery,
// not the record — the server writes the record (api/record-consent.js), with
// the IP, the time and the edition of each document that was agreed to.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { perchedImage } from '../data/guideArt';
import { SUMMARY_OWL } from './guidePlacement';
import { perchTransform } from './guide/guideGeometry';
import { legalDocPath } from '../data/legalDocs';
import { colors, fonts, radii, shadows } from '../styles/tokens';
import { SUMMARY_BRIEFING_Z } from './summaryGuideLayout';

const HOUSE_GUIDE = 'mentor';
const OWL_SRC = perchedImage(HOUSE_GUIDE, 'lantern');
const CARD_W = 720;

// Three things that decide whether this will work for them, in the order they
// would meet them.
const BEATS = [
  {
    label: 'What it asks of you',
    text: 'It starts with an intake, and from there Compass builds a map of how you lead that grows with you over time. It only works if you answer honestly — your genuine, candid thinking, not the answer that sounds right.',
  },
  {
    label: 'What it asks of your team',
    text: 'You will invite your team to give anonymous feedback. You need at least three people, and they have to be people you lead directly — not peers, friends or anyone picked at random. Their view of your leadership is the point.',
  },
  {
    label: 'Who sees it',
    text: 'You do. What you tell Compass is never shared with HR, your manager or any leader in your business, and we never sell it. You are the sole owner of it.',
  },
];

const linkSx = {
  color: colors.orangeDeep,
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
};

// Each document opens in its own tab, so reading one never costs the form
// behind this card.
function DocLink({ id, children }) {
  return (
    <Box
      component="a"
      href={legalDocPath(id)}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      sx={linkSx}
    >
      {children}
    </Box>
  );
}

// A real checkbox, labelled by its sentence. Clicking the sentence ticks it —
// except on a link inside it, which opens the document instead.
function Tick({ checked, onChange, autoFocus, children }) {
  return (
    <Box
      component="label"
      sx={{
        // Relative, so the hidden input is held inside the row. Left to find
        // its own containing block it landed below the card, and focusing it
        // scrolled the whole card up to go and look.
        position: 'relative',
        display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
        '&:has(input:focus-visible) .tick-box': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
      }}
    >
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.checked)}
        sx={{ position: 'absolute', top: 2, left: 2, opacity: 0, width: 14, height: 14, m: 0 }}
      />
      <Box className="tick-box" aria-hidden sx={{
        flexShrink: 0, mt: '1px', width: 18, height: 18, borderRadius: '5px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${checked ? colors.orangeDeep : colors.sand300}`,
        bgcolor: checked ? colors.orangeDeep : '#fff',
        color: colors.sand50, fontSize: 11, lineHeight: 1, fontWeight: 700,
      }}>
        {checked ? '✓' : ''}
      </Box>
      <Box sx={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.5, color: colors.inkSoft }}>
        {children}
      </Box>
    </Box>
  );
}

// Drawn exactly as GuidePortrait draws its owl: SUMMARY_OWL's frame, pushed
// out by the art's own padding so the branch lands on the corner, mirrored to
// face into the room. Above the scrim so it stays crisp over the blur.
function Guide() {
  return (
    <Box
      aria-hidden
      sx={{
        position: SUMMARY_OWL.position,
        left: SUMMARY_OWL.left,
        bottom: SUMMARY_OWL.bottom,
        width: SUMMARY_OWL.width,
        transform: perchTransform(OWL_SRC, true),
        zIndex: SUMMARY_BRIEFING_Z + 1,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <Box
        component="img"
        src={OWL_SRC}
        alt=""
        draggable={false}
        sx={{
          width: '100%',
          height: 'auto',
          display: 'block',
          transform: 'scaleX(-1)',
          transformOrigin: 'center bottom',
          filter: 'drop-shadow(0 16px 36px rgba(9,16,31,0.28))',
        }}
      />
    </Box>
  );
}

export default function ConsentCeremony({ open, busy, onAgree, onCancel }) {
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Every opening is a fresh read: "Not yet" and back again should not arrive
  // already agreed, or already opted in.
  useEffect(() => {
    if (open) { setAgreed(false); setMarketing(false); }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const blocked = !agreed || busy;

  return createPortal(
    <>
    {/* Three layers: the scrim, the guide on it, and the card over both —
        so where a narrow window brings the card across the bird, the words
        win. */}
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: SUMMARY_BRIEFING_Z,
        bgcolor: 'rgba(9,16,31,0.5)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
    />
    <Guide />
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: SUMMARY_BRIEFING_Z + 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* The way out is the outlined button, not a click on the scrim. A form
          full of typing sits behind this, and dismissing it by accident reads
          as having lost the lot. */}
      <Box
        sx={{
          display: 'flex',
          overflow: 'hidden',
          borderRadius: radii.xl,
          boxShadow: '0 40px 90px rgba(9,16,31,0.4)',
          bgcolor: colors.sand50,
          width: `min(100%, ${CARD_W}px)`,
          maxHeight: 'calc(100vh - 32px)',
          animation: 'consentIn 220ms cubic-bezier(.2,.9,.25,1) both',
          '@keyframes consentIn': {
            from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
            to: { opacity: 1, transform: 'none' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {/* Only the words scroll, and only on a window too short for them —
            the buttons are part of the column and must never be what falls
            off the bottom. */}
        <Box sx={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          p: { xs: '24px 22px', sm: '32px 36px' },
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Typography sx={{
            fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: colors.orangeDeep, mb: '12px',
          }}>
            Before you pay
          </Typography>

          <Typography id="consent-title" sx={{
            fontFamily: fonts.serif, fontSize: { xs: 24, sm: 28 }, fontWeight: 500,
            lineHeight: 1.12, letterSpacing: '-0.02em', color: colors.ink, mb: '10px',
          }}>
            Is Compass right for you?
          </Typography>

          <Typography sx={{
            fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15,
            lineHeight: 1.5, color: colors.inkSoft, mb: '20px',
          }}>
            It asks something of you and of your team. If these three fit, you are a good candidate.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mb: '20px' }}>
            {BEATS.map((beat) => (
              <Box key={beat.label} sx={{ borderLeft: `2px solid ${colors.brass}`, pl: '14px' }}>
                <Box sx={{
                  fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: colors.orangeDeep, mb: '4px',
                }}>
                  {beat.label}
                </Box>
                <Box sx={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 1.55, color: colors.ink }}>
                  {beat.text}
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ pt: '16px', borderTop: `1px solid ${colors.sand200}` }}>
            {/* Two boxes, never one. The agreement is required and gates the
                button; the newsletter is optional, starts unticked and gates
                nothing. Folding marketing into the agreement weakens both. */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: '18px' }}>
              <Tick checked={agreed} onChange={setAgreed} autoFocus>
                I have read and agree to the <DocLink id="terms">Terms of Service</DocLink>,{' '}
                <DocLink id="privacy">Privacy Policy</DocLink>, and{' '}
                <DocLink id="consent">Consent to Participate</DocLink>.
              </Tick>
              <Tick checked={marketing} onChange={setMarketing}>
                Yes, send me newsletters, product updates, and occasional offers by email. You can
                unsubscribe anytime.
              </Tick>
            </Box>

            <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Box
                component="button"
                type="button"
                disabled={blocked}
                onClick={() => { if (!blocked) onAgree?.({ marketingOptIn: marketing }); }}
                sx={{
                  all: 'unset', boxSizing: 'border-box',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  px: '26px', minHeight: 44, borderRadius: radii.pill,
                  bgcolor: colors.navy900, color: colors.amberSoft,
                  fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700,
                  boxShadow: blocked ? 'none' : shadows.buttonPrimary,
                  cursor: busy ? 'wait' : blocked ? 'not-allowed' : 'pointer',
                  opacity: blocked && !busy ? 0.45 : 1,
                  transition: 'opacity 140ms',
                  '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
                }}
              >
                {busy ? 'Creating…' : 'Create my account'}
              </Box>
              {/* Never gated — the only way out of a question should not be
                  agreeing with it. */}
              <Box
                component="button"
                type="button"
                onClick={busy ? undefined : onCancel}
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
                Not yet
              </Box>
            </Box>
          </Box>
        </Box>

      </Box>
    </Box>
    </>,
    document.body
  );
}
