/**
 * Catalog fixtures — three frozen states of the whole app.
 *
 * Every page in Compass reads its content out of localStorage rather than
 * holding it, so a page opened against an empty store renders correctly and
 * renders nothing. To *look* at a page you first have to put the app into a
 * state where that page has something to draw.
 *
 * There is no way to be in two states at once, so one seed can never reach
 * every page: a locked intake and a blank intake are the same route drawing
 * two different things. Hence three, each pinned to a moment in the journey:
 *
 *   fresh     — nothing filled in.        Landing, sign-in, account, guide
 *               select, the empty intake.
 *   mid       — answered, unlocked, live. The reflection, trait selection,
 *               the builder, open surveys, the dashboard still listening.
 *   finished  — closed, results in.       The locked ledger, closed surveys,
 *               and every dashboard room.
 *
 * These are deliberately built on `seedStagingData()` rather than the demo's
 * persona path: the persona path picks a leader and a guide at random, and a
 * catalog whose content changes between visits cannot be used to judge a
 * design change. Everything here is deterministic — same bytes every time.
 *
 * Nothing here calls an API. Summary text comes from STAGING_GUIDE_SUMMARIES
 * via the staging seed, so the pages render instantly, for free, and never
 * fail. The words the guides say are wrong on purpose; this is for looking at
 * layout, not at content.
 */

import {
  seedStagingData,
  STAGING_BUNDLE_ID,
  STAGING_EMAIL,
  STAGING_SELF_ID,
  STAGING_TEAM_ID,
} from './stagingSeed';
import { seedDemoBlankIntake } from './demoMode';

export const FIXTURES = [
  {
    id: 'fresh',
    label: 'Fresh',
    blurb: 'Nothing filled in. The way a new account arrives.',
  },
  {
    id: 'mid',
    label: 'Mid-journey',
    blurb: 'Intake answered and still unlocked, reflection written, campaign live and collecting.',
  },
  {
    id: 'finished',
    label: 'Finished',
    blurb: 'Intake locked, campaign closed, results in, every dashboard room open.',
  },
];

export const DEFAULT_FIXTURE = 'mid';

export const getFixture = (id) => FIXTURES.find((f) => f.id === id) || null;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

// Mirrors getDebriefScope() in pages/Dashboard/cc/phaseState.js. Kept in step
// with it by hand — if the scoping there changes, the finished fixture stops
// opening the rooms and this is the line to fix.
const debriefScope = () => `signalDebrief_${STAGING_BUNDLE_ID}_${STAGING_EMAIL}`;

/**
 * Wipe everything this session can see.
 *
 * Inside a demo session `localStorage` is shimmed onto prefixed sessionStorage
 * (see demoMode.installDemoStorage), so this clears only the demo's own keys
 * and never touches a real signed-in account on the same browser.
 */
function wipe() {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem('summaryBriefingSeen');
    sessionStorage.removeItem('journeyCeremonyOpen');
  } catch {
    /* ignore */
  }
}

/** Nothing answered yet — the blank slate every early page expects. */
function applyFresh() {
  seedDemoBlankIntake();
}

/** Answered, unlocked, campaign open. The staging seed is already this state. */
function applyMid() {
  seedStagingData();
}

/**
 * The far end of the journey.
 *
 * Starts from the mid fixture and advances it: locks the intake so the ledger
 * renders in its sealed form, closes both surveys, and marks Signal and
 * Evidence read so the dashboard rooms open rather than gating behind one
 * another. Practice is left undone on purpose — an unfinished room is a state
 * worth being able to look at.
 */
function applyFinished() {
  seedStagingData();

  const now = new Date().toISOString();
  const lock = { locked: true, lockedAt: now, lockedFrom: 'catalog-fixture' };

  const draft = readJson('intakeDraft', {});
  writeJson('intakeDraft', { ...draft, intakeLock: lock });
  writeJson('intakeStatus', {
    ...readJson('intakeStatus', {}),
    started: true,
    complete: true,
    updatedAt: now,
  });

  writeJson('campaignRecords', {
    ...readJson('campaignRecords', {}),
    selfCompleted: true,
    campaignLocked: true,
    teamCampaignClosed: true,
    teamCampaignClosedAt: now,
  });

  [STAGING_SELF_ID, STAGING_TEAM_ID].forEach((id) => {
    const campaign = readJson(`campaign_${id}`, null);
    if (campaign) writeJson(`campaign_${id}`, { ...campaign, surveyClosed: true });
  });

  try {
    localStorage.setItem('selfCampaignCompleted', 'true');
    localStorage.setItem(`selfCampaignCompleted_${STAGING_SELF_ID}`, 'true');
    localStorage.setItem('teamCampaignCompleted', 'true');
  } catch {
    /* ignore */
  }

  const scope = debriefScope();
  writeJson(`${scope}_done`, { signal: true, evidence: true, practice: false });
  writeJson(`${scope}_pages`, { signal: 0, evidence: 0, practice: 0 });

  // Chapter transitions are one-shot and sticky. Clearing the flag means the
  // ceremony is visible again on every catalog entry instead of once ever.
  try {
    localStorage.removeItem('journeyCeremonySeen');
  } catch {
    /* ignore */
  }
}

const BUILDERS = {
  fresh: applyFresh,
  mid: applyMid,
  finished: applyFinished,
};

/**
 * Reset to a fixture, unconditionally.
 *
 * Called on every catalog link — not on failure, not on first visit, every
 * single time. Pages write to storage as you look at them, so a catalog that
 * reset only when something looked broken would drift exactly the way staging
 * did. Wiping first is what makes each entry identical to the last.
 */
export function applyFixture(id) {
  const build = BUILDERS[id] || BUILDERS[DEFAULT_FIXTURE];
  wipe();
  build();
}
