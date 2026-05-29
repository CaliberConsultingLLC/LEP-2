import { colors } from '../../../styles/tokens';

// ----------------------------------------------------------------------------
// The four quadrants of the Effort × Efficacy map.
//
// Axes (matching the assessment language):
//   x = Effort   — how intentional and attentive the leader is in this trait
//   y = Efficacy — how well they're meeting their team's needs in this trait
//
// Names are framed by the *position the leader should take*, not just the
// current state. The upper-right (high effort + high efficacy) is the goal —
// the highest Compass score lives there.
//
// corner: where the label is drawn on the chart (x: left|right, y: top|bottom)
// ----------------------------------------------------------------------------
export const QUADRANTS = {
  naturalGift: {
    id: 'naturalGift',
    label: 'Natural Gift',
    sub: 'Effective with ease',
    short: 'effective here with little strain — lean into it.',
    color: colors.green,
    corner: { x: 'left', y: 'top' },
    meaning:
      'Your team feels the results here without feeling much grind — you’re effective almost effortlessly.',
    stance:
      'Treat it as leverage. Name it, lean on it, and add just enough intention that it keeps growing instead of quietly coasting.',
  },
  fullStrength: {
    id: 'fullStrength',
    label: 'Full Strength',
    sub: 'Intentional & landing',
    short: 'strong effort and strong results — protect this.',
    color: colors.green,
    corner: { x: 'right', y: 'top' },
    meaning:
      'Real effort and real results — you’re putting in intentional work and your team is feeling the payoff. This is the strongest place to be.',
    stance:
      'Protect and sustain it. Notice what’s working so you can repeat it, and guard against burnout so a peak doesn’t slowly erode.',
  },
  untapped: {
    id: 'untapped',
    label: 'Untapped',
    sub: 'Not yet claimed',
    short: 'quiet ground, not yet claimed — invest if it matters.',
    color: colors.textSecondary,
    corner: { x: 'left', y: 'bottom' },
    meaning:
      'Neither much effort nor much result is showing up here yet. It’s not a failure — it’s unclaimed ground.',
    stance:
      'Decide whether this trait matters for where you’re headed. If it does, a small, deliberate investment can move it quickly.',
  },
  offTarget: {
    id: 'offTarget',
    label: 'Off Target',
    sub: 'Effort not yet landing',
    short: 'hard work that isn’t landing yet — adjust the approach.',
    color: colors.orange,
    corner: { x: 'right', y: 'bottom' },
    meaning:
      'You’re working hard here, but your team isn’t feeling the results yet. The effort is real; the aim needs adjusting.',
    stance:
      'Don’t add more effort — change the approach. Ask your team what would actually help, and redirect the energy you’re already spending.',
  },
};

export const QUADRANT_LIST = [
  QUADRANTS.naturalGift,
  QUADRANTS.fullStrength,
  QUADRANTS.untapped,
  QUADRANTS.offTarget,
];

// Resolve a quadrant from raw effort / efficacy values (0–100).
export function getQuadrant(effort, efficacy) {
  const highEffort = Number(effort) >= 50;
  const highEfficacy = Number(efficacy) >= 50;
  if (highEfficacy && highEffort) return QUADRANTS.fullStrength;
  if (highEfficacy && !highEffort) return QUADRANTS.naturalGift;
  if (!highEfficacy && highEffort) return QUADRANTS.offTarget;
  return QUADRANTS.untapped;
}

// Shared tooltip / explainer copy for a quadrant.
export function quadrantExplainer(q) {
  return `${q.meaning} ${q.stance}`;
}
