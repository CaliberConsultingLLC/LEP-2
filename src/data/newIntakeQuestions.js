// UI adapter for the seven new intake questions.
//
// intakeTraitCoverageV2.js is the single source of truth for wording, options,
// formats, and trait signals. This module translates those definitions into the
// entry shape IntakeForm's behaviorSet expects, so the question a leader sees
// and the signals the model scores can never drift apart.

import { NEW_QUESTIONS } from './intakeTraitCoverageV2.js';

export const NQ_BY_FIELD = Object.fromEntries(
  NEW_QUESTIONS.filter((q) => q.fieldId).map((q) => [q.fieldId, q])
);

const FORMAT_TO_TYPE = { choice: 'radio', ranking: 'ranking', open: 'text' };

/** Builds one behaviorSet entry from the coverage definition. */
export function buildNewQuestionEntry(fieldId) {
  const q = NQ_BY_FIELD[fieldId];
  if (!q) throw new Error(`Unknown new intake question: ${fieldId}`);
  const type = q.select ? 'multi-select' : FORMAT_TO_TYPE[q.format];
  return {
    id: fieldId,
    theme: q.theme,
    prompt: q.prompt,
    type,
    ...(q.options ? { options: [...q.options] } : {}),
    // Pick-two questions require exactly `select` answers — limit caps the UI,
    // minSelections gates the Next button.
    ...(q.select ? { limit: q.select, minSelections: q.select } : {}),
  };
}

/**
 * The requirement line shown under every behavior prompt, in the same words
 * everywhere — what is asked must be abundantly clear before the options are
 * read. Rank questions share one label; The Uphill Pitch adds what its
 * extremes mean, since scoring reads them as most / least like you.
 */
export function requirementLabelFor(q) {
  if (!q) return '';
  if (q.type === 'radio') return 'Choose 1';
  if (q.type === 'multi-select') {
    if (q.minSelections != null && q.minSelections === q.limit) {
      return `Choose ${q.minSelections} of ${q.options?.length || ''}`.trim();
    }
    if (q.limit != null) return `Choose up to ${q.limit}`;
    return 'Choose all that apply';
  }
  if (q.type === 'ranking') {
    return q.id === 'uphillPitch'
      ? 'Rank all — top is most like you, bottom is least'
      : 'Rank all — drag to order';
  }
  if (q.type === 'text') return 'Open response';
  return '';
}

// The chapter-close screen before the three open stories, in the style of the
// mindset intro. Copy is a placeholder — the owners write the real version.
export const STORY_INTRO_ENTRY = {
  id: 'storyIntro',
  theme: 'The Last Stretch',
  prompt: 'Three short stories to finish.',
  body:
    'No options from here — just tell each one the way it actually happened. '
    + 'A few honest sentences beat a polished paragraph.',
  type: 'intro',
};
