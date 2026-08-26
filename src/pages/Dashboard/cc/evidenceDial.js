import { colors } from '../../../styles/tokens';

export const DIAL_ZONES = {
  honed: {
    id: 'honed',
    label: 'Honed, keep perfecting',
    note: 'The work goes in and it lands. This is the one to sharpen, not rebuild.',
    tint: colors.zoneHonedTint,
    ink: colors.zoneHonedInk,
    a0: -45,
    place: { left: '50%', top: '6%', transform: 'translate(-50%, 0)', textAlign: 'center' },
  },
  offtarget: {
    id: 'offtarget',
    label: 'Off-target, but intentional',
    note: 'The effort is real and it is not landing. This one needs attention and training.',
    tint: colors.zoneOfftargetTint,
    ink: colors.orangeDeep,
    a0: 45,
    place: { left: '94%', top: '50%', transform: 'translate(-100%, -50%)', textAlign: 'right' },
  },
  missing: {
    id: 'missing',
    label: 'Missing the mark',
    note: 'Little effort, little result. Nothing to build on here yet — start with attention.',
    tint: colors.zoneMissingTint,
    ink: colors.inkSoft,
    a0: 135,
    place: { left: '50%', top: '94%', transform: 'translate(-50%, -100%)', textAlign: 'center' },
  },
  natural: {
    id: 'natural',
    label: 'Natural, needs tending',
    note: 'Lands without much push. Keep a little intention on it so it does not drift.',
    tint: colors.zoneNaturalTint,
    ink: colors.navy600,
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

export function perceptionGap(team, self) {
  return Math.round(Number(team) || 0) - Math.round(Number(self) || 0);
}

export function metricLabel(mode) {
  if (mode === 'effort') return 'Effort score';
  if (mode === 'efficacy') return 'Efficacy score';
  return 'Compass score';
}

export function scoresFor(statement, mode) {
  if (mode === 'effort') {
    return { team: Math.round(statement.effort || 0), self: Math.round(statement.effortSelf || 0) };
  }
  if (mode === 'efficacy') {
    return { team: Math.round(statement.efficacy || 0), self: Math.round(statement.efficacySelf || 0) };
  }
  return { team: Math.round(statement.compass || 0), self: Math.round(statement.compassSelf || 0) };
}
