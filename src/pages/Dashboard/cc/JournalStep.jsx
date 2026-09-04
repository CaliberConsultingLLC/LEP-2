import React, { useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { fonts } from '../../../styles/tokens';
import { PAPER } from './fieldJournalUtils.js';

// One step in the thread down the right leaf.
//
// Only two states are ever drawn: written (a title, a check, and — once the
// whole entry is complete — the answer read back), and open (the question, the
// cue, and ruled paper to write on). Everything below the open step is not
// rendered at all, so a leader sees the one question they are answering and
// the ones they already answered, and nothing else.

export const STEP_KEYFRAMES = {
  '@keyframes fjStepIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'none' },
  },
  '@keyframes fjCollapse': {
    from: { opacity: 0.4, transform: 'translateY(-4px)' },
    to: { opacity: 1, transform: 'none' },
  },
  '@keyframes fjInkIn': {
    from: { opacity: 0, filter: 'blur(3px)', transform: 'translateY(2px)' },
    to: { opacity: 1, filter: 'blur(0)', transform: 'none' },
  },
};

const RULED = 'repeating-linear-gradient(to bottom, transparent 0 27px, rgba(15,28,46,0.14) 27px 28px)';

/** `all: unset` takes the focus ring with it, so every control puts one back. */
export const focusRing = (accent) => ({
  '&:focus-visible': { outline: `2px solid ${accent}`, outlineOffset: 3, borderRadius: '2px' },
});

export default function JournalStep({
  def,
  n,
  value,
  active,
  draft,
  showAnswer,
  accent,
  accentHi,
  last,
  goal,
  goalSet,
  current,
  goalMin,
  dense,
  readOnly,
  onDraft,
  onFocus,
  onEdit,
  onSave,
  onGoal,
}) {
  const areaRef = useRef(null);
  const isActive = Boolean(active) && !readOnly;
  const filled = def.kind === 'goal' ? Boolean(goalSet) : Boolean(String(value || '').trim());
  const isDone = !isActive && filled;
  const bullets = Boolean(def.bullets);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSave(def.key);
        return;
      }
      if (!bullets || e.key !== 'Enter') return;
      // A list of behaviors reads as a list. The bullet is inserted for the
      // leader rather than asked of them.
      e.preventDefault();
      const el = e.target;
      const at = el.selectionStart;
      const next = `${el.value.slice(0, at)}\n• ${el.value.slice(el.selectionEnd)}`;
      onDraft(next);
      requestAnimationFrame(() => {
        if (!areaRef.current) return;
        areaRef.current.selectionStart = at + 3;
        areaRef.current.selectionEnd = at + 3;
      });
    },
    [bullets, def.key, onDraft, onSave]
  );

  if (!isActive && !isDone) return null;

  const answerText =
    def.kind === 'goal'
      ? `Landing at ${goal} from ${current}`
      : def.kind === 'quote'
        ? `“${value}”`
        : value;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        gap: '14px',
        alignItems: 'stretch',
        fontFamily: fonts.serif,
        color: PAPER.ink,
        flexShrink: 0,
        animation: isActive
          ? 'fjStepIn 460ms cubic-bezier(0.2,0.8,0.2,1) both'
          : 'fjCollapse 360ms ease both',
      }}
    >
      {/* marker + thread */}
      <Box sx={{ position: 'relative', width: 24, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isDone ? (
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              flexShrink: 0,
              background: `linear-gradient(180deg, ${accentHi}, ${accent})`,
              boxShadow: '0 2px 6px rgba(15,28,46,0.22), inset 0 1px 1px rgba(255,255,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.sans,
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            ✓
          </Box>
        ) : (
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              flexShrink: 0,
              border: `1.5px solid ${accent}`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.mono,
              fontSize: 10,
              fontWeight: 700,
              color: accent,
              bgcolor: PAPER.page,
            }}
          >
            {n}
          </Box>
        )}
        {!last && (
          <Box sx={{ flex: 1, width: '1px', mt: '6px', bgcolor: isDone ? accent : PAPER.rule }} />
        )}
      </Box>

      {/* content */}
      <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : isActive ? '14px' : showAnswer ? '7px' : dense ? '6px' : '12px' }}>
        {isDone && (
          <>
            <Box
              component="button"
              type="button"
              onClick={() => !readOnly && onEdit(def.key)}
              title="Reopen"
              sx={{
                all: 'unset',
                cursor: readOnly ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box',
                pt: '2px',
                ...focusRing(accent),
                '&:hover .fj-step-title': { color: readOnly ? PAPER.ink2 : accent },
              }}
            >
              <Typography
                className="fj-step-title"
                sx={{ fontFamily: fonts.sans, fontSize: 13.5, fontWeight: 700, color: PAPER.ink2, lineHeight: 1.3 }}
              >
                {def.title}
              </Typography>
              {!readOnly && (
                <Typography
                  sx={{
                    fontFamily: fonts.mono,
                    fontSize: 7.5,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#c9b995',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Written · reopen
                </Typography>
              )}
            </Box>
            {showAnswer && (
              <Typography
                sx={{
                  mt: '1px',
                  fontFamily: fonts.serif,
                  fontStyle: 'italic',
                  fontSize: 12.5,
                  lineHeight: 1.35,
                  color: PAPER.muted,
                  whiteSpace: 'pre-line',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  animation: 'fjInkIn 600ms ease both',
                }}
              >
                {answerText}
              </Typography>
            )}
          </>
        )}

        {isActive && (
          <>
            <Typography
              sx={{ fontFamily: fonts.sans, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: accent, pt: '3px' }}
            >
              {def.title}
            </Typography>
            <Typography
              sx={{ fontFamily: fonts.serif, fontSize: 18, fontWeight: 500, lineHeight: 1.32, color: PAPER.ink, mt: '4px', textWrap: 'pretty' }}
            >
              {def.question}
            </Typography>
            {def.cue && (
              <Typography
                sx={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.45, color: PAPER.sepia, mt: '4px', textWrap: 'pretty' }}
              >
                {def.cue}
              </Typography>
            )}

            {def.kind !== 'goal' ? (
              <Box sx={{ mt: '10px' }}>
                <Box sx={{ position: 'relative', background: RULED }}>
                  <Box
                    component="textarea"
                    ref={areaRef}
                    value={draft}
                    placeholder={def.placeholder}
                    onChange={(e) => onDraft(e.target.value)}
                    onFocus={() => {
                      onFocus(def.key);
                      if (bullets && !String(draft || '').trim()) onDraft('• ');
                    }}
                    onKeyDown={handleKeyDown}
                    sx={{
                      display: 'block',
                      width: '100%',
                      // A reopened step in a full thread gives back a line so
                      // the last written row still lands on the page.
                      height: `${(dense ? Math.max(3, (def.lines || 5) - 1) : def.lines || 5) * 28 + 4}px`,
                      boxSizing: 'border-box',
                      resize: 'none',
                      background: 'transparent',
                      border: 'none',
                      p: '4px 2px 0',
                      fontFamily: fonts.serif,
                      fontSize: 16,
                      lineHeight: '28px',
                      color: PAPER.ink,
                      caretColor: accent,
                      outline: 'none',
                      '&::placeholder': { color: 'rgba(68,86,108,0.45)' },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: '8px' }}>
                  <Typography
                    sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: PAPER.sepiaSoft, minWidth: 0, pr: '10px' }}
                  >
                    {def.hint || 'Ctrl/⌘ + Enter to write it in'}
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onSave(def.key)}
                    sx={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontFamily: fonts.sans,
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: accent,
                      py: '6px',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      opacity: String(draft || '').trim() ? 1 : 0.45,
                      ...focusRing(accent),
                      '&:hover': { color: '#8d3418' },
                    }}
                  >
                    Write it in →
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: '14px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0 }}>
                    <Typography sx={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: 600, color: PAPER.sepia, fontVariantNumeric: 'tabular-nums' }}>
                      {current}
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.mono, fontSize: 11, color: PAPER.sepia }}>→</Typography>
                    <Typography
                      sx={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em', color: PAPER.ink2, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {goal}
                    </Typography>
                  </Box>
                  <Box
                    component="input"
                    type="range"
                    min={goalMin}
                    max={100}
                    value={goal}
                    onChange={(e) => onGoal(Number(e.target.value))}
                    sx={{ flex: 1, minWidth: 0, height: 22, m: 0, accentColor: accent, cursor: 'pointer' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: '10px' }}>
                  <Typography
                    sx={{ fontFamily: fonts.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: PAPER.sepiaSoft, minWidth: 0, pr: '10px' }}
                  >
                    Honest, not heroic · six to ten points is a change people feel
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onSave(def.key)}
                    sx={{
                      all: 'unset',
                      cursor: 'pointer',
                      fontFamily: fonts.sans,
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: accent,
                      py: '6px',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      ...focusRing(accent),
                      '&:hover': { color: '#8d3418' },
                    }}
                  >
                    Set it →
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
