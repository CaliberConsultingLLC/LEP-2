// The Trait Room — the Evidence page body, one trait at a time.
//
// The dial on the left, the five statements on the right, and a ribbon along
// the bottom for the thought you want to carry into the plan. The table IS the
// selector: there are no statement tabs, and clicking a row both expands it and
// lights its node on the dial.
//
// Idle means nothing is selected — all five dots on the dial, no self ghost, no
// gap chip, every row collapsed. That is the arrival state, and clicking an
// open row returns to it.

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import EvidenceQuadrant, { EvidenceModeBar } from './EvidenceQuadrant';
import { DIAL_ZONES, perceptionGap, scoresFor, zoneFor } from './evidenceDial';
import { appendTraitNote, notesLabel, readTraitNotes } from './traitRoomNotes';
import MetricHint from '../../../components/MetricHint';
import { SCORE_HINTS } from '../../../data/scoreGlossary';
import { colors, fonts, radii, shadows, surfaces, type } from '../../../styles/tokens';
import { useGuide } from '../../../context/GuideContext';

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
            <MetricRow label="Efficacy" team={statement.efficacy} self={statement.efficacySelf} />
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

function NotesRibbon({ trait, selectedIdx }) {
  const [notes, setNotes] = useState(() => readTraitNotes(trait));
  const { setHidden, setPageMessage } = useGuide();

  useEffect(() => { setNotes(readTraitNotes(trait)); }, [trait]);

  // The note goes to the guide rather than into a form sitting open at the
  // bottom of the room. Pressing this raises the owl if it is collapsed and
  // turns its bubble into the place the note is typed — and it stays there
  // for the next one, because a reading rarely produces exactly one thought.
  const openWithGuide = () => {
    setHidden(false);
    setPageMessage({
      text: `Anything you want to carry into action planning from ${trait}? Tell me and I will keep it with this trait.`,
      pose: 'think',
      composer: {
        placeholder: 'Something to bring into the plan…',
        submitLabel: 'Log it',
        helper: 'Cmd/Ctrl + Enter saves',
        onSubmit: (text) => {
          setNotes(appendTraitNote(trait, text, Number.isInteger(selectedIdx) ? selectedIdx : null));
        },
      },
    });
  };

  return (
    <Box
      sx={{
        ...surfaces.card,
        p: { xs: '12px 14px', md: '12px 18px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        flexWrap: 'wrap',
      }}
    >
      <Typography sx={{
        fontFamily: fonts.sans, fontSize: 13, lineHeight: 1.5, color: colors.inkSoft,
      }}>
        If you&#8217;d like to add a note ahead of action planning, log it here.
        {notes.length ? (
          <Box component="span" sx={{
            ml: '10px', fontFamily: fonts.mono, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.inkSoft,
          }}>
            {notesLabel(notes.length)}
          </Box>
        ) : null}
      </Typography>

      <Box
        component="button"
        type="button"
        onClick={openWithGuide}
        sx={{
          all: 'unset', boxSizing: 'border-box',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          px: '20px', minHeight: 36, borderRadius: radii.pill,
          bgcolor: colors.navy900, color: colors.amberSoft,
          fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700,
          boxShadow: shadows.buttonPrimary,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'transform 140ms, background 140ms',
          '&:hover': { bgcolor: colors.navy800, transform: 'translateY(-1px)' },
          '&:focus-visible': { outline: `3px solid ${colors.ringFocus}`, outlineOffset: 2 },
        }}
      >
        Add a note
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

  return (
    <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto', pb: '8px' }}>
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

      {/* Stage */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '470px minmax(0, 1fr)' },
        gap: { xs: '18px', md: '28px' },
        alignItems: 'start',
        mb: '16px',
      }}>
        <Box>
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
          <Box sx={{ mt: '14px', '& > div': { width: '100%' }, '& > div > div': { width: '100%', justifyContent: 'space-between' } }}>
            <EvidenceModeBar mode={mode} onModeChange={setMode} />
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '10px', gap: '12px' }}>
            <Typography sx={{
              fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: colors.inkSoft,
            }}>
              What your team rated
            </Typography>
            <Typography sx={{
              fontFamily: fonts.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: colors.inkSoft,
            }}>
              Score · {mode === 'effort' ? 'Effort' : mode === 'efficacy' ? 'Efficacy' : 'Compass'}
            </Typography>
          </Box>

          <Box sx={{
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
        </Box>
      </Box>

      <NotesRibbon trait={traitLabel} selectedIdx={selected} />
    </Box>
  );
}
