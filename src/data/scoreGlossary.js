/** Hover copy for Compass / Effort / Efficacy and Evidence tiles. */

export const SCORE_HINTS = {
  compass:
    'Compass is the combined reading of how a behavior is landing. Higher means the team sees it more clearly. It is a pattern, not a personality score.',
  effort:
    'Effort is how much the behavior is being tried. Your team rates what they can see — not your intent.',
  efficacy:
    'Efficacy is how well the behavior lands for the people around you.',
  teammatesHeard:
    'How many teammates submitted the anonymous survey. You never see who said what.',
  statementsRated:
    'Each trait has five observable statements. This is the total rated across your traits.',
  traitsMeasured:
    'The growth traits this campaign is measuring — the ones you chose after the reflection.',
  perceptionGap:
    'Team score minus your self-score. A gap is useful signal, not a verdict.',
  selfScore:
    'How you rated the same statements. Sit it next to the team reading; neither one is “the truth” alone.',
};

export function hintForMetricLabel(label) {
  const key = String(label || '').toLowerCase();
  if (key.includes('effort')) return SCORE_HINTS.effort;
  if (key.includes('efficacy')) return SCORE_HINTS.efficacy;
  if (key.includes('compass')) return SCORE_HINTS.compass;
  if (key.includes('perception')) return SCORE_HINTS.perceptionGap;
  if (key.includes('self')) return SCORE_HINTS.selfScore;
  return '';
}
