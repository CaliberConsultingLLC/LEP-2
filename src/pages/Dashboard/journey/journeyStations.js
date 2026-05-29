/**
 * Journey stations — the nine Compass steps placed along the baked trail of
 * public/journey-base.png.
 *
 * Coordinates are NORMALIZED to the image (0–1): x grows left→right, y grows
 * top→bottom. They sit roughly on the dashed amber route — the early steps
 * wander wide through the lower foothills (preparation / exploration), then the
 * later steps climb and spread out toward the summit (growth).
 *
 * `kind`:
 *   'phase'      → a process milestone (no campaign data of its own)
 *   'assessment' → a listening point that carries Compass scores
 *   'action'     → a practice/action-plan commitment point
 */
export const JOURNEY_STATIONS = [
  {
    key: 'intake',
    label: 'Profile & Intake',
    x: 0.155,
    y: 0.87,
    kind: 'phase',
    blurb: 'Where it begins — you told the Compass who you are and what you lead.',
  },
  {
    key: 'behaviors',
    label: 'Behaviors & Instincts',
    x: 0.26,
    y: 0.73,
    kind: 'phase',
    blurb: 'You named the instincts that shape how you show up under pressure.',
  },
  {
    key: 'campaign',
    label: 'Campaign Creation',
    x: 0.375,
    y: 0.85,
    kind: 'phase',
    blurb: 'You chose the traits to listen for and invited your team to weigh in.',
  },
  {
    key: 'assessment',
    label: 'Self & Team Assessment',
    x: 0.51,
    y: 0.78,
    kind: 'assessment',
    campaign: 'team',
    blurb: 'The first real signal — how you and your team each read your leadership.',
  },
  {
    key: 'reflect',
    label: 'Review & Reflect',
    x: 0.60,
    y: 0.65,
    kind: 'phase',
    blurb: 'Sitting with the signal before acting — letting the gaps speak.',
  },
  {
    key: 'action',
    label: 'Action Plan',
    x: 0.675,
    y: 0.55,
    kind: 'action',
    blurb: 'Turning insight into a practice your team can actually feel.',
  },
  {
    key: 'checkin',
    label: 'Check-In Assessment',
    x: 0.745,
    y: 0.44,
    kind: 'assessment',
    campaign: 'checkin',
    blurb: 'A second reading — is the practice landing the way you hoped?',
  },
  {
    key: 'revise',
    label: 'Revise Action Plan',
    x: 0.805,
    y: 0.33,
    kind: 'action',
    blurb: 'Adjusting the climb — keep what’s working, change what isn’t.',
  },
  {
    key: 'final',
    label: 'Final Assessment',
    x: 0.855,
    y: 0.205,
    kind: 'assessment',
    campaign: 'final',
    blurb: 'The summit reading — proof of how far your team has felt you grow.',
  },
];

export const JOURNEY_BASE_SRC = '/journey-base.png';
