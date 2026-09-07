// The Trait Room — the Evidence page body, one trait at a time.
//
// The dial on the left, the five statements on the right, and — beneath them,
// sharing one bottom edge — the three mode buttons and the note pad they sit
// beside. The table IS the selector: there are no statement tabs, and clicking
// a row both expands it and lights its node on the dial.
//
// Idle means nothing is selected — all five dots on the dial, no self ghost, no
// gap chip, every row collapsed. That is the arrival state, and clicking an
// open row returns to it.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import EvidenceQuadrant, { EvidenceModeBar } from './EvidenceQuadrant';
import { useFitScale } from './useFitScale.js';
import { DIAL_ZONES, perceptionGap, scoresFor, zoneFor } from './evidenceDial';
import { appendTraitNote, notesLabel, readTraitNotes } from './traitRoomNotes';
import MetricHint from '../../../components/MetricHint';
import { SCORE_HINTS } from '../../../data/scoreGlossary';
import { colors, fonts, radii, shadows, surfaces, type } from '../../../styles/tokens';

const HAIRLINE_ON_NAVY = 'rgba(244,206,161,0.20)';
const signed = (n) => `${n > 0 ? '+' : ''}${n}`;

/** Ink for the active mode — the score column follows whichever mode is on. */
const modeInk = (mode) => {
  if (mode === 'effort') return colors.orange;
  if (mode === 'efficacy') return colors.efficacyBlue;
  return colors.navy900;
};

const modeHint = (mode) => {
  if (mode === 'effort') return SCORE_HINTS.effort;
  if (mode === 'efficacy') return SCORE_HINTS.efficacy;
  return SCORE_HINTS.compass;
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function ZoneChip({ zone, onNavy = false }) {
  const ink = onNavy ? zone.inkOnNavy : zone.ink;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        px: '10px',
        py: '4px',
        flexShrink: 0,
        borderRadius: radii.pill,
        border: `1px solid ${ink}`,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
      }}
    >
      <Box aria-hidden sx={{ width: 5, height: 5, borderRadius: radii.circle, bgcolor: ink }} />
      <Typography
        component="span"
        sx={{
          fontFamily: fonts.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: ink,
          lineHeight: 1,
        }}
      >
        {zone.label}
      </Typography>
    </Box>
  );
}

function BigStat({ value, label, hint, ink }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <Typography sx={{
        fontFamily: fonts.serif, fontSize: { xs: 34, md: 46 }, fontWeight: 500,
        lineHeight: 1, letterSpacing: '-0.02em', color: ink,
      }}>
        <MetricHint title={hint}>{value}</MetricHint>
      </Typography>
      <Typography sx={{
        fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: colors.inkSoft,
      }}>
        {label}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Statement table
// ---------------------------------------------------------------------------

/** One metric line inside the navy block: label, then Team | Self | Gap. */
function MetricRow({ label, team, self }) {
  const gap = self - team;
  const cell = (v, l, ink) => (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '5px', px: '14px' }}>
      <Typography sx={{ fontFamily: fonts.serif, fontSize: 17, fontWeight: 500, lineHeight: 1, color: ink }}>
        {v}
      </Typography>
      <Typography sx={{
        fontFamily: fonts.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: colors.navy300,
      }}>
        {l}
      </Typography>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <Typography sx={{
        fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: colors.navy300, minWidth: 66,
      }}>
        {label}
      </Typography>
      <Box sx={{
        display: 'flex', alignItems: 'center',
        '& > *:not(:first-of-type)': { borderLeft: `1px solid ${HAIRLINE_ON_NAVY}` },
      }}>
        {cell(team, 'team', '#f0e9de')}
        {cell(self, 'self', '#f0e9de')}
        {cell(signed(gap), 'gap', colors.amberSoft)}
      </Box>
    </Box>
  );
}

function StatementRow({ statement, open, mode, onToggle, isLast }) {
  const zone = zoneFor(statement.effort, statement.efficacy);
  const { team } = scoresFor(statement, mode);
  const compass = mode === 'map';

  if (open) {
    return (
      <Box sx={{ bgcolor: colors.navy900, p: { xs: '18px 20px', md: '22px 26px' } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          {/* The quote is an inline span so the chip can sit beside its last
              word and wrap under it only when the line runs out of room. */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" sx={{
              fontFamily: fonts.serif, fontSize: { xs: 18, md: 22 }, fontWeight: 500,
              lineHeight: 1.32, color: '#ffffff', mr: '10px',
            }}>
              “{statement.text}”
            </Typography>
            <ZoneChip zone={zone} onNavy />
          </Box>
          <Box
            component="button"
            type="button"
            onClick={onToggle}
            aria-label="Collapse statement"
            sx={{
              all: 'unset', cursor: 'pointer', flexShrink: 0,
              color: colors.navy300, fontSize: 13, lineHeight: 1, p: '4px',
              '&:hover': { color: colors.amberSoft },
              '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
            }}
          >
            ⌃
          </Box>
        </Box>

        {/* One line, always. A stance that wraps stops reading as a stance. */}
        <Typography sx={{
          fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.5,
          color: colors.navy300, mt: '10px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {zone.note}
        </Typography>

        <Stack spacing="10px" sx={{ mt: '16px' }}>
          {(compass || mode === 'effort') && (
            <MetricRow label="Effort" team={statement.effort} self={statement.effortSelf} />
          )}
          {(compass || mode === 'efficacy') && (
            <MetricRow label="Effectiveness" team={statement.efficacy} self={statement.efficacySelf} />
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      aria-expanded={false}
      sx={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
        display: 'flex', alignItems: 'center', gap: '12px',
        p: '15px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${colors.sand200}`,
        transition: 'background 140ms',
        '&:hover': { bgcolor: colors.sand50 },
        '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: -3 },
      }}
    >
      <Box aria-hidden sx={{ color: colors.sand300, fontSize: 12, lineHeight: 1, flexShrink: 0 }}>⌄</Box>
      <Typography sx={{
        flex: 1, minWidth: 0,
        fontFamily: fonts.serif, fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: colors.ink,
      }}>
        {statement.text}
      </Typography>
      <Typography sx={{
        fontFamily: fonts.serif, fontSize: 19, fontWeight: 500, lineHeight: 1,
        color: modeInk(mode), flexShrink: 0,
      }}>
        <MetricHint title={modeHint(mode)}>{team}</MetricHint>
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Bottom ribbon
// ---------------------------------------------------------------------------

function NotePad({ trait, selectedIdx, onResize }) {
  const [notes, setNotes] = useState(() => readTraitNotes(trait));
  const [draft, setDraft] = useState('');
  const areaRef = useRef(null);

  useEffect(() => { setNotes(readTraitNotes(trait)); setDraft(''); }, [trait]);

  // The box starts small and grows with what is written in it, rather than
  // opening at the size of the longest note anyone might leave.
  const grow = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  };
  // Growing the box changes the height of the room, so the room re-measures
  // itself against its window rather than being clipped mid-sentence.
  useEffect(() => { grow(); onResize?.(); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const keep = () => {
    const text = draft.trim();
    if (!text) return;
    setNotes(appendTraitNote(trait, text, Number.isInteger(selectedIdx) ? selectedIdx : null));
    setDraft('');
  };

  return (
    <Box
      sx={{
        ...surfaces.card,
        p: { xs: '14px 16px', md: '16px 18px' },
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
        <Typography sx={{
          fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: colors.inkSoft,
        }}>
          A note for the plan
        </Typography>
        {notes.length ? (
          <Typography sx={{
            fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: colors.green,
          }}>
            {notesLabel(notes.length)}
          </Typography>
        ) : null}
      </Box>

      {/* Click in and type. The placeholder is the first half of the sentence
          the leader is most likely to be writing. */}
      <Box
        component="textarea"
        ref={areaRef}
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); keep(); }
        }}
        placeholder={'“I noticed…”'}
        aria-label={`A note for the plan on ${trait}`}
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          resize: 'none',
          overflow: 'auto',
          minHeight: 58,
          p: '10px 12px',
          borderRadius: radii.sm,
          border: `1px solid ${colors.sand200}`,
          bgcolor: colors.sand50,
          fontFamily: fonts.serif,
          fontSize: 14,
          lineHeight: 1.5,
          color: colors.ink,
          '&::placeholder': { color: colors.inkSoft, opacity: 0.8, fontStyle: 'italic' },
          '&:focus': { outline: 'none', borderColor: colors.orange, bgcolor: colors.surface1 },
        }}
      />

      {/* The button leads on the left. The guide stands over the bottom-right
          corner of every room, and the one control here is the one thing that
          must not end up behind an owl. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Box
          component="button"
          type="button"
          disabled={!draft.trim()}
          onClick={keep}
          sx={{
            all: 'unset', boxSizing: 'border-box',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            px: '18px', minHeight: 32, borderRadius: radii.pill,
            bgcolor: colors.navy900, color: colors.amberSoft,
            fontFamily: fonts.sans, fontSize: 12, fontWeight: 700,
            flexShrink: 0,
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            opacity: draft.trim() ? 1 : 0.45,
            transition: 'opacity 140ms, background 140ms',
            '&:hover': { bgcolor: draft.trim() ? colors.navy800 : colors.navy900 },
            '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
          }}
        >
          Keep it
        </Box>
        <Typography sx={{
          fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 11.5, lineHeight: 1.4,
          color: colors.inkSoft, minWidth: 0,
        }}>
          {draft.trim()
            ? 'Cmd/Ctrl + Enter keeps it'
            : '“This shows up when…” · “Ask them about…”'}
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Trait Room
// ---------------------------------------------------------------------------

export default function TraitRoom({ row, statements }) {
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('map');

  const traitLabel = row?.subTrait || row?.trait || 'Trait';

  // Arriving at a new trait resets to idle — the previous trait's open
  // statement has no meaning here.
  useEffect(() => { setSelected(null); setMode('map'); }, [traitLabel]);

  const traitZone = useMemo(() => {
    const effort = Math.round(Number(row?.team?.effort) || 0);
    const efficacy = Math.round(Number(row?.team?.efficacy) || 0);
    return zoneFor(effort, efficacy);
  }, [row]);

  const traitCompass = Math.round(Number(row?.team?.lepScore) || 0);
  const mirror = perceptionGap(
    Math.round(Number(row?.self?.lepScore) || 0),
    Math.round(Number(row?.team?.lepScore) || 0)
  );

  const toggle = (idx) => setSelected((prev) => (prev === idx ? null : idx));

  // The room is given a fixed box with overflow hidden, so it measures itself
  // into it rather than trusting it will fit. Opening a statement changes the
  // height, so every selection re-measures.
  const { frameRef, contentRef, fit, remeasure } = useFitScale();
  useEffect(remeasure, [traitLabel, selected, mode, remeasure]);

  return (
    <Box
      ref={frameRef}
      // A clipped frame is never scrolled. Focusing the note pad makes the
      // browser scroll it into view, which drags the top of the room out of
      // sight and leaves it there; the room fits, so the answer is to refuse
      // the scroll rather than to allow it.
      onScroll={(e) => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0; }}
      sx={{ width: '100%', maxWidth: 1180, mx: 'auto', flex: 1, minHeight: 0, overflow: 'hidden', '--fit': fit }}
    >
    <Box
      ref={contentRef}
      sx={{
        width: 'calc(100% / var(--fit))',
        transformOrigin: 'top left',
        transform: 'scale(var(--fit))',
        pb: '8px',
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' },
        justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', mb: '18px',
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...type.eyebrow, mb: '6px' }}>Trait Room</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Typography sx={{
              fontFamily: fonts.serif, fontSize: { xs: 27, md: 36 }, fontWeight: 500,
              lineHeight: 1.05, letterSpacing: '-0.025em', color: colors.ink,
            }}>
              {traitLabel}
            </Typography>
            <ZoneChip zone={traitZone} />
          </Box>
        </Box>
        <Stack direction="row" spacing="26px" sx={{ flexShrink: 0 }}>
          <BigStat value={traitCompass} label="Compass" hint={SCORE_HINTS.compass} ink={colors.orangeDeep} />
          <BigStat
            value={signed(mirror)}
            label="Mirror"
            hint="How your own rating compares with your team's — self minus team."
            ink={colors.navy900}
          />
        </Stack>
      </Box>

      {/* Stage. Both columns stretch to the taller of the two, and the last
          thing in each is pushed to the bottom — so the mode buttons and the
          note pad share one bottom edge no matter how tall the table runs. */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '470px minmax(0, 1fr)' },
        gap: { xs: '18px', md: '28px' },
        alignItems: 'stretch',
        mb: '16px',
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* The dial is sized by its own width and nothing else. Its inner
              square carries `flex: 1` against a full-height root, so the moment
              it becomes a stretching item in a column it takes the row's spare
              height and the compass goes oval — which is what expanding a
              statement did. Boxed here so its height stays a function of its
              width; the spare height goes to the gap above the mode bar
              instead, which is what keeps the two bottom edges together. */}
          <Box sx={{ flexShrink: 0 }}>
          {/* `selectedIdx="all"` is the dial's idle presentation: every dot
              visible, none selected, no ghost, no gap chip. */}
          <EvidenceQuadrant
            statements={statements}
            selectedIdx={selected == null ? 'all' : selected}
            onSelect={(idx) => toggle(idx)}
            mode={mode}
            onModeChange={setMode}
            showModeBar={false}
          />
          </Box>
          {/* Held to its own width and centred under the dial. Stretched edge
              to edge, three pills read as a segmented control the width of the
              instrument; brought in, they read as a choice about it. */}
          <Box sx={{ mt: 'auto', pt: '14px', display: 'flex', justifyContent: 'center', '& > div': { mb: 0 } }}>
            <EvidenceModeBar mode={mode} onModeChange={setMode} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* One word, on the right, naming the column of numbers. The row used
              to carry "What your team rated" as well — everything in this room
              is what the team rated, so it was labelling the room. */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', mb: '10px' }}>
            <Typography sx={{
              fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: colors.inkSoft,
            }}>
              {mode === 'effort' ? 'Effort' : mode === 'efficacy' ? 'Effectiveness' : 'Compass'}
            </Typography>
          </Box>

          {/* The five statements and their scores are the room. The guide used
              to land on two of them outright, so it is told to stay off. */}
          <Box
            data-guide-keepclear=""
            sx={{
            bgcolor: colors.surface1,
            border: `1px solid ${colors.sand200}`,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: shadows.card,
          }}>
            {statements.map((s, i) => (
              <StatementRow
                key={`${s.text}-${i}`}
                statement={s}
                open={selected === i}
                mode={mode}
                onToggle={() => toggle(i)}
                isLast={i === statements.length - 1}
              />
            ))}
          </Box>

          {/* The note lives beside the three buttons, in the space the table
              leaves under itself, rather than as a ribbon across the room. */}
          <Box sx={{ mt: 'auto', pt: '16px' }}>
            <NotePad trait={traitLabel} selectedIdx={selected} onResize={remeasure} />
          </Box>
        </Box>
      </Box>
    </Box>
    </Box>
  );
}
