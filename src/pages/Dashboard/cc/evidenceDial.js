import { colors } from '../../../styles/tokens';

// `plate` is the flat fill behind a Compass score in the statement table — the
// quadrant's own colour, carried off the dial and under the number so the
// column says which zone each statement sits in before you read the score. It
// is a fixed hex in both themes, like the journey folio palette: the ink on top
// of it is always near-black, so the plate cannot be allowed to darken.
//
// `ink` is tuned for the cream dial face. The Trait Room expands a statement
// into a navy-900 block, where those inks go nearly invisible, so each zone
// also carries the brighter variant that reads on navy.
export const DIAL_ZONES = {
  honed: {
    id: 'honed',
    label: 'Honed, keep perfecting',
    note: 'The work goes in and it lands. This is the one to sharpen, not rebuild.',
    tint: colors.zoneHonedTint,
    plate: '#f0dfa8',
    ink: colors.zoneHonedInk,
    inkOnNavy: colors.amber,
    a0: -45,
    place: { left: '50%', top: '6%', transform: 'translate(-50%, 0)', textAlign: 'center' },
  },
  offtarget: {
    id: 'offtarget',
    label: 'Off-target, but intentional',
    note: 'The effort is real and it is not landing. This one needs attention and training.',
    tint: colors.zoneOfftargetTint,
    plate: '#f2cfae',
    ink: colors.orangeDeep,
    inkOnNavy: colors.orange,
    a0: 45,
    place: { left: '94%', top: '50%', transform: 'translate(-100%, -50%)', textAlign: 'right' },
  },
  missing: {
    id: 'missing',
    label: 'Missing the mark',
    note: 'Little effort, little result. Nothing to build on here yet — start with attention.',
    tint: colors.zoneMissingTint,
    plate: '#ded8cd',
    ink: colors.inkSoft,
    // No existing token sits at this muted gray-blue; it comes straight from
    // the approved prototype, which is the source of truth for the navy block.
    inkOnNavy: '#9fb0c3',
    a0: 135,
    place: { left: '50%', top: '94%', transform: 'translate(-50%, -100%)', textAlign: 'center' },
  },
  natural: {
    id: 'natural',
    label: 'Natural, needs tending',
    note: 'Lands without much push. Keep a little intention on it so it does not drift.',
    tint: colors.zoneNaturalTint,
    plate: '#cfdfea',
    ink: colors.navy600,
    inkOnNavy: colors.navy300,
    a0: 225,
    place: { left: '6%', top: '50%', transform: 'translate(0, -50%)', textAlign: 'left' },
  },
};

export function zoneFor(effort, efficacy) {
  const highEffort = Number(effort) >= 50;
  const highEfficacy = Number(efficacy) >= 50;
  if (highEfficacy && highEffort) return DIAL_ZONES.honed;
  if (highEfficacy && !highEffort) return DIAL_ZONES.natural;
  if (!highEfficacy && highEffort) return DIAL_ZONES.offtarget;
  return DIAL_ZONES.missing;
}

// A score that is present, or null. Absent is not zero anywhere on this page.
const shown = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);

export function perceptionGap(team, self) {
  const t = shown(team);
  const s = shown(self);
  // No self reading is not a gap of zero. Zero is a claim — that the two
  // readings land on the same number — and there is nothing here to agree
  // with. The caller has to say "not answered", not "no distance".
  if (t == null || s == null) return null;
  return t - s;
}

export function metricLabel(mode) {
  if (mode === 'effort') return 'Effort score';
  if (mode === 'efficacy') return 'Effectiveness score';
  return 'Compass score';
}

// `team` is always a number — the room answered or the page would not be here.
// `self` is null when the leader did not rate that axis.
export function scoresFor(statement, mode) {
  if (mode === 'effort') {
    return { team: shown(statement.effort) ?? 0, self: shown(statement.effortSelf) };
  }
  if (mode === 'efficacy') {
    return { team: shown(statement.efficacy) ?? 0, self: shown(statement.efficacySelf) };
  }
  return { team: shown(statement.compass) ?? 0, self: shown(statement.compassSelf) };
}

// ---------------------------------------------------------------------------
// Score plates — the fill behind a number in the statement table
// ---------------------------------------------------------------------------

// The width of the score column, shared by both statement tables so the plates
// and the word naming them land on the same centre in either view.
export const SCORE_COL = 66;

// Near-black, held as a literal rather than `colors.ink`: the plates below do
// not remap in dark mode, so the ink on them must not either.
export const PLATE_INK = '#0f1c2e';

// Effort and Effectiveness are single axes, so their plates carry a ramp
// instead of a zone: the same climb the dial face makes from its empty corner
// out to the deep orange and deep blue edges. The table is ranked highest
// first, so the ramp reads as one gradient down the column.
const RAMPS = {
  effort: [[253, 242, 232], [201, 105, 38]],
  efficacy: [[238, 245, 251], [56, 121, 178]],
};

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * The flat fill behind one score. Compass gets its quadrant's colour, whole;
 * effort and effectiveness get their point on the ramp. Anything else — a
 * missing score, an unknown mode — gets nothing, and the cell stays paper.
 */
export function scorePlate(score, mode, zone) {
  if (mode !== 'effort' && mode !== 'efficacy') return zone?.plate || 'transparent';
  const n = Number(score);
  if (!Number.isFinite(n)) return 'transparent';
  const [lo, hi] = RAMPS[mode];
  const t = clamp01(n / 100);
  const at = (i) => Math.round(lo[i] + (hi[i] - lo[i]) * t);
  return `rgb(${at(0)}, ${at(1)}, ${at(2)})`;
}
