import React from 'react';
import { Box, Typography } from '@mui/material';
import { fonts } from '../../../styles/tokens';
import JournalStep, { focusRing } from './JournalStep.jsx';
import { JOURNAL_ASSETS, PAPER, truncateNote } from './fieldJournalUtils.js';

// One leaf of the open journal — 560 × 700 of paper.
//
// Three kinds live here: a blank ruled left leaf, a trait entry, and the
// closing ledger. They share the paper, the gutter shade and the footer so a
// turn between them reads as the same book rather than three screens.

export const PAGE_KEYFRAMES = {
  '@keyframes fjStampFade': {
    '0%': { opacity: 0, transform: 'rotate(-6deg) scale(1.35)' },
    '70%': { opacity: 0.9, transform: 'rotate(-6deg) scale(0.98)' },
    '100%': { opacity: 0.85, transform: 'rotate(-6deg) scale(1)' },
  },
  '@keyframes fjStampIn': {
    '0%': { opacity: 0, transform: 'scale(1.6) rotate(-16deg)' },
    '60%': { opacity: 1, transform: 'scale(0.93) rotate(-7deg)' },
    '100%': { opacity: 1, transform: 'scale(1) rotate(-7deg)' },
  },
};

const PAPER_BG = {
  backgroundImage: `url(${JOURNAL_ASSETS.paper})`,
  backgroundRepeat: 'repeat',
  backgroundSize: '256px 256px',
  backgroundColor: PAPER.page,
};

function Hairline({ mt }) {
  return <Box sx={{ position: 'relative', height: '1px', bgcolor: PAPER.rule, mt, flexShrink: 0 }} />;
}

function ScoreCell({ label, value }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
      <Typography
        sx={{ fontFamily: fonts.mono, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: PAPER.sepia }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ fontFamily: fonts.serif, fontSize: 26, lineHeight: 1, fontWeight: 600, color: PAPER.ink2, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function InsightCard({ card, accent, onReadAll, readOnly }) {
  const { short, truncated } = truncateNote(card.text, 150);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: 0,
        p: '9px 12px',
        bgcolor: 'rgba(251,247,240,0.85)',
        borderRadius: '6px',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <Typography
        sx={{ fontFamily: fonts.mono, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}
      >
        {card.who}
      </Typography>
      <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.42, color: PAPER.ink2, minWidth: 0 }}>
        {short}{' '}
        {truncated && (
          <Box
            component="button"
            type="button"
            onClick={() => !readOnly && onReadAll?.(card)}
            sx={{
              all: 'unset',
              cursor: readOnly ? 'default' : 'pointer',
              fontFamily: fonts.sans,
              fontStyle: 'normal',
              fontSize: 10.5,
              fontWeight: 700,
              color: '#c0612a',
              ...focusRing('#c0612a'),
            }}
          >
            more
          </Box>
        )}
      </Typography>
    </Box>
  );
}

function WaxSeal({ children, size = 32, fontSize = 11 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 32% 26%, #c85a30, #8d3418 72%)',
        boxShadow: '0 4px 10px rgba(15,28,46,0.32), inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.25)',
        fontFamily: fonts.brand,
        fontWeight: 700,
        fontSize,
        letterSpacing: '0.06em',
        color: PAPER.waxText,
        animation: 'fjStampIn 480ms cubic-bezier(0.2,0.9,0.3,1.2) both',
      }}
    >
      {children}
    </Box>
  );
}

function Footer({ backLabel, onBack, folio, dots, accent, fwdLabel, onFwd, fwdReady, readOnly }) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: '8px',
        pt: '6px',
        flexShrink: 0,
        minHeight: 28,
      }}
    >
      {backLabel ? (
        <Box
          component="button"
          type="button"
          onClick={() => !readOnly && onBack?.()}
          sx={{
            all: 'unset',
            cursor: readOnly ? 'default' : 'pointer',
            fontFamily: fonts.sans,
            fontSize: 12.5,
            fontWeight: 700,
            color: PAPER.muted,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            ...focusRing(accent),
            '&:hover': { color: PAPER.ink },
          }}
        >
          <Box component="span" sx={{ fontSize: 15, lineHeight: 1 }}>‹</Box>
          {backLabel}
        </Box>
      ) : (
        <Box sx={{ width: 60 }} />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Typography sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.18em', color: PAPER.sepia }}>
          {folio}
        </Typography>
        {Boolean(dots?.length) && (
          <Box sx={{ display: 'flex', gap: '5px' }}>
            {dots.map((d, i) => (
              <Box
                key={i}
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                  bgcolor: d ? accent : 'transparent',
                  border: `1px solid ${d ? accent : PAPER.dotted}`,
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {fwdLabel ? (
        <Box
          component="button"
          type="button"
          onClick={() => !readOnly && onFwd?.()}
          sx={{
            all: 'unset',
            cursor: readOnly ? 'default' : 'pointer',
            fontFamily: fonts.sans,
            fontSize: 12.5,
            fontWeight: 700,
            color: fwdReady ? accent : PAPER.sepia,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            ...focusRing(accent),
            '&:hover': { color: fwdReady ? '#8d3418' : PAPER.ink },
          }}
        >
          {fwdLabel}
          <Box component="span" sx={{ fontSize: 15, lineHeight: 1 }}>›</Box>
        </Box>
      ) : (
        <Box sx={{ width: 60 }} />
      )}
    </Box>
  );
}

export default function JournalPage(props) {
  const {
    kind = 'trait',
    side = 'right',
    blankLabel = '',
    accent = '#c0612a',
    accentHi = '#e07a3f',
    trait,
    insights = [],
    respondents = 0,
    steps = [],
    draft = '',
    traitDone = false,
    stampDate = '',
    folio = '',
    dots = null,
    backLabel = '',
    onBack,
    fwdLabel = '',
    onFwd,
    fwdReady = false,
    onReadAll,
    goal,
    goalMin,
    current,
    goalSet,
    onDraft,
    onFocus,
    onEdit,
    onSave,
    onGoal,
    ledger = [],
    allDone = false,
    signed = false,
    signLabel = 'Sign the entry',
    onSign,
    onOpenTrait,
    signatureName = '',
    signedDate = 'Awaiting signature',
    ghost = false,
    readOnly = false,
  } = props;

  const inert = ghost || readOnly;
  // The answers and the completion stamp belong to an entry at rest. While a
  // step is reopened the page needs that height for the ruled paper, so the
  // thread goes back to titles until the step is written in again.
  const anyActive = steps.some((s) => s.active);
  const showAnswers = traitDone && !anyActive;
  // Reopening a step in a finished entry is the fullest the thread ever gets:
  // five written titles and a ruled writing area. The written rows tighten so
  // the last of them still lands on the page.
  const dense = anyActive && steps.length >= 6;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...PAPER_BG,
        display: 'flex',
        flexDirection: 'column',
        p: kind === 'blank' ? 0 : '22px 40px 14px 40px',
        fontFamily: fonts.serif,
        color: PAPER.ink,
      }}
    >
      {/* gutter shade — the fold is on the inside edge of whichever leaf this is */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            side === 'left'
              ? 'linear-gradient(270deg, rgba(60,40,20,0.13), rgba(60,40,20,0.03) 9%, transparent 22%)'
              : 'linear-gradient(90deg, rgba(60,40,20,0.16), rgba(60,40,20,0.04) 8%, transparent 20%)',
        }}
      />

      {kind === 'blank' && (
        <>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'repeating-linear-gradient(to bottom, transparent 0 27px, rgba(15,28,46,0.05) 27px 28px)',
              backgroundPosition: '0 88px',
            }}
          />
          <Typography
            sx={{
              position: 'absolute',
              left: 32,
              top: 26,
              fontFamily: fonts.mono,
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'rgba(138,122,94,0.6)',
            }}
          >
            {blankLabel}
          </Typography>
          {/* the owl stands in front of this leaf, so the paper is fogged back */}
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', bgcolor: 'rgba(251,247,240,0.64)' }} />
        </>
      )}

      {kind === 'trait' && (
        <>
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#c0612a', whiteSpace: 'nowrap' }}
              >
                Field journal
              </Typography>
              <Typography
                sx={{ fontFamily: fonts.serif, fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, mt: '6px', whiteSpace: 'nowrap' }}
              >
                Insights to share
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: '18px', flexShrink: 0, alignItems: 'flex-end', pb: '2px' }}>
              <ScoreCell label="Compass" value={trait?.team} />
              <ScoreCell label="Effort" value={trait?.effort} />
              <ScoreCell label="Efficacy" value={trait?.efficacy} />
            </Box>
          </Box>
          <Hairline mt="10px" />

          <Box sx={{ position: 'relative', mt: '10px', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Typography
                sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: PAPER.sepia, whiteSpace: 'nowrap' }}
              >
                Insights from your results
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Typography
                sx={{ fontFamily: fonts.mono, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: PAPER.sepiaSoft }}
              >
                {respondents} {respondents === 1 ? 'response' : 'responses'}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', mt: '8px' }}>
              {insights.map((card, i) => (
                <InsightCard key={i} card={card} accent={accent} onReadAll={onReadAll} readOnly={inert} />
              ))}
            </Box>
          </Box>

          <Box sx={{ position: 'relative', mt: '12px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, mb: '8px' }}>
              <Typography
                sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: accent, whiteSpace: 'nowrap' }}
              >
                Envision · Adjust · Commit
              </Typography>
              <Box sx={{ flex: 1 }} />
              {traitDone && <WaxSeal>I</WaxSeal>}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {steps.map((s, i) => (
                <JournalStep
                  key={s.def.key}
                  def={s.def}
                  n={s.n}
                  value={s.value}
                  active={s.active}
                  draft={draft}
                  showAnswer={showAnswers}
                  accent={accent}
                  accentHi={accentHi}
                  last={i === steps.length - 1}
                  goal={goal}
                  goalSet={goalSet}
                  current={current}
                  goalMin={goalMin}
                  dense={dense}
                  readOnly={inert}
                  onDraft={onDraft}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  onSave={onSave}
                  onGoal={onGoal}
                />
              ))}

              {showAnswers && (
                <Box sx={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 186,
                      height: 58,
                      border: `3px solid ${accent}`,
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transform: 'rotate(-6deg)',
                      color: accent,
                      opacity: 0.85,
                      mixBlendMode: 'multiply',
                      animation: 'fjStampFade 900ms cubic-bezier(0.2,0.9,0.3,1.1) 300ms both',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
                    }}
                  >
                    <Typography sx={{ fontFamily: fonts.brand, fontWeight: 700, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                      Entry complete
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                      {trait?.label} · {stampDate}
                    </Typography>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: '-3px',
                        borderRadius: '10px',
                        backgroundImage: `url(${JOURNAL_ASSETS.paper})`,
                        backgroundSize: '180px',
                        opacity: 0.35,
                        mixBlendMode: 'screen',
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </>
      )}

      {kind === 'ledger' && (
        <>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Typography
              sx={{ fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#c0612a' }}
            >
              Field journal · closing entry
            </Typography>
            <Typography sx={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, mt: '6px' }}>
              The Commitment
            </Typography>
            <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 14, color: PAPER.muted, mt: '5px' }}>
              Three promises, one signature.
            </Typography>
            <Hairline mt="12px" />
            <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, color: PAPER.ink2, mt: '14px', textWrap: 'pretty' }}>
              {signed
                ? 'Signed and dated. These hold until the next reading of the signal.'
                : 'This is the whole entry. Three traits, three numbers, three sentences your team will actually hear.'}
            </Typography>
            {ledger.map((r, i) => (
              <Box key={r.label} sx={{ mt: '14px', pb: '12px', borderBottom: `1px solid ${PAPER.hairline}` }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: fonts.sans,
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#fff',
                      bgcolor: r.done ? PAPER.success : 'transparent',
                      border: `1px solid ${r.done ? PAPER.success : PAPER.dotted}`,
                      boxSizing: 'border-box',
                      transform: 'translateY(3px)',
                    }}
                  >
                    {r.done ? '✓' : String(i + 1)}
                  </Box>
                  <Typography sx={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 13 }}>{r.label}</Typography>
                  <Typography sx={{ fontFamily: fonts.mono, fontSize: 11.5, fontWeight: 700, color: '#c0612a' }}>{r.range}</Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: PAPER.hairline }} />
                  {!inert && (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onOpenTrait?.(i)}
                      sx={{ all: 'unset', cursor: 'pointer', fontFamily: fonts.sans, fontSize: 11, fontWeight: 700, color: PAPER.muted, ...focusRing(accent) }}
                    >
                      Open the page →
                    </Box>
                  )}
                </Box>
                <Typography
                  sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: PAPER.ink2, mt: '6px', pl: '30px' }}
                >
                  {r.message}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, color: PAPER.ink2, mt: '16px', textWrap: 'pretty' }}>
              {signed
                ? 'Sent to your next check-in. Your team sees the three commitments — not your notes.'
                : 'Signing sends the three commitments to your team at the next check-in. The rest of this journal stays yours.'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
              <Box
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderBottom: `1.5px solid ${PAPER.ink2}`,
                  height: 64,
                  display: 'flex',
                  alignItems: 'flex-end',
                  pb: '6px',
                }}
              >
                {signed && (
                  <Typography
                    sx={{
                      fontFamily: fonts.serif,
                      fontStyle: 'italic',
                      fontSize: 30,
                      color: '#10223c',
                      animation: 'fjInkIn 700ms ease both',
                      transform: 'rotate(-2deg)',
                      pl: '6px',
                    }}
                  >
                    {signatureName}
                  </Typography>
                )}
              </Box>
              {signed ? (
                <WaxSeal size={62} fontSize={10.5}>SIGNED</WaxSeal>
              ) : (
                <Box
                  component="button"
                  type="button"
                  onClick={() => !inert && onSign?.()}
                  sx={{
                    all: 'unset',
                    cursor: inert ? 'default' : 'pointer',
                    flexShrink: 0,
                    bgcolor: '#10223c',
                    color: PAPER.buttonText,
                    fontFamily: fonts.sans,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.03em',
                    p: '12px 24px',
                    borderRadius: '999px',
                    boxShadow: '0 10px 24px rgba(15,28,46,0.28)',
                    whiteSpace: 'nowrap',
                    opacity: allDone ? 1 : 0.5,
                    ...focusRing(accent),
                    '&:hover': { bgcolor: '#1c3457' },
                  }}
                >
                  {signLabel}
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: '6px' }}>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: PAPER.sepia }}>
                Signature
              </Typography>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: PAPER.sepia }}>
                {signedDate}
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {kind !== 'blank' && (
        <Footer
          backLabel={backLabel}
          onBack={onBack}
          folio={folio}
          dots={dots}
          accent={accent}
          fwdLabel={fwdLabel}
          onFwd={onFwd}
          fwdReady={fwdReady}
          readOnly={inert}
        />
      )}
    </Box>
  );
}
