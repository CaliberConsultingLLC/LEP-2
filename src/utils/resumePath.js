import { getSelfCampaignId, selfAssessmentComplete } from '../data/chapterMap';
import { isCompleteFocusAreaSet, readFocusAreas } from './focusAreas';

const readRaw = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const readJson = (key) => {
  try {
    return JSON.parse(readRaw(key) || 'null');
  } catch {
    return null;
  }
};

/**
 * Where a returning leader belongs.
 *
 * Signing in used to land everyone on the dashboard. For anyone who had not
 * finished the intake that is a room with nothing in it — Base Camp reports on
 * a journey they have not taken yet — so the answer is the step they stopped
 * on, and Base Camp only once the self assessment is behind them.
 *
 * Read in order: each check assumes everything above it is already done, so
 * the first unmet one is the resume point.
 *
 * This reads the same localStorage keys `hydrateJourneyState` has just filled
 * from Firestore, so it works on a browser that has never seen this account.
 * Call it after that hydrate, never before.
 */
export function resolveResumePath() {
  if (!String(readRaw('selectedGuideId') || '').trim()) return '/guide-select';

  const intakeStatus = readJson('intakeStatus');
  if (!intakeStatus?.complete) {
    // The step does not travel in the URL. IntakeForm restores
    // intakeDraft.currentStep itself, so arriving at the intake is what puts a
    // leader back on question 13 — and a leader with no draft at all has not
    // cleared the profile questions that come before it.
    return readJson('intakeDraft') ? '/form?stage=intake' : '/form?stage=profile';
  }

  if (!readRaw('aiSummary') && !readRaw('summariesByGuide')) return '/summary';
  if (!isCompleteFocusAreaSet(readFocusAreas())) return '/trait-selection';
  if (!getSelfCampaignId()) return '/campaign-builder';
  if (!selfAssessmentComplete()) return '/self-assessment';

  return '/dashboard';
}

export default resolveResumePath;
