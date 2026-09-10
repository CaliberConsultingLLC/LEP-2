import { STAGING_PERSONAS } from '../data/stagingPersonas';
import { CAMPAIGN_TRAITS, SEED_FOCUS_AREAS } from './stagingSeed';
import { persistFocusAreas } from './focusAreas';
import { STAGING_GUIDE_SUMMARIES, stagingFlattenedSummary } from '../data/stagingGuideSummaries';
import { STAGING_GUIDE_LINES } from '../data/stagingGuideLines';
import { SELECTABLE_GUIDE_PERSONAS } from '../data/guidePersonas';

const FLAG_KEY = 'compassDemo';
// Set by the seeded demo paths. Marks a session whose campaign is already on
// disk, so pages use it instead of calling an API that has nothing to add.
const STATIC_KEY = 'compassDemoStatic';
// Two demos, two drawers.
//
// The catalog and the clickthroughs want opposite things from storage. The
// catalog is a contact sheet: every link resets first, on purpose, so a page
// looks the same on the tenth visit as the first. A clickthrough is a run —
// you answer the intake, wait out a real generation, and the whole point is
// that what comes back is still there ten minutes later.
//
// They used to share one drawer, so the catalog's reset ate the run. That is
// the bug behind "I read a full summary, went to look at something else, came
// back and it was shorter": the catalog had wiped the generated reading and
// seeded Alex's frozen fixture over it, and the fixture is about half the
// length. Splitting the prefix lets the catalog keep resetting as hard as it
// likes without reaching a run in progress.
const SCOPE_KEY = 'compassDemoScope';
const PREFIXES = { run: 'demo_', catalog: 'democat_' };
const DEFAULT_SCOPE = 'run';

function readScope() {
  try {
    const scope = sessionStorage.getItem(SCOPE_KEY);
    return PREFIXES[scope] ? scope : DEFAULT_SCOPE;
  } catch {
    return DEFAULT_SCOPE;
  }
}

function activePrefix() {
  return PREFIXES[readScope()];
}

function readFlag() {
  try {
    return sessionStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDemoPath() {
  try {
    const path = String(window.location.pathname || '');
    return path === '/demo' || path.startsWith('/demo/');
  } catch {
    return false;
  }
}

/** True when this demo was seeded with a campaign rather than generating one. */
export function isDemoStatic() {
  try {
    return sessionStorage.getItem(STATIC_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDemoSession() {
  return readFlag();
}

export function demoRequestFields() {
  return isDemoSession() ? { source: 'demo' } : {};
}

function parseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function installDemoStorage() {
  if (typeof window === 'undefined') return;
  if (window.__compassDemoStorageInstalled) return;

  const session = window.sessionStorage;
  const proto = Storage.prototype;
  const origGet = proto.getItem;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  const origClear = proto.clear;

  try {
    proto.getItem = function getItem(key) {
      if (readFlag() && this === window.localStorage) {
        return origGet.call(session, activePrefix() + String(key));
      }
      return origGet.call(this, key);
    };

    proto.setItem = function setItem(key, value) {
      if (readFlag() && this === window.localStorage) {
        origSet.call(session, activePrefix() + String(key), String(value));
        return;
      }
      origSet.call(this, key, value);
    };

    proto.removeItem = function removeItem(key) {
      if (readFlag() && this === window.localStorage) {
        origRemove.call(session, activePrefix() + String(key));
        return;
      }
      origRemove.call(this, key);
    };

    proto.clear = function clear() {
      if (readFlag() && this === window.localStorage) {
        const toRemove = [];
        for (let i = 0; i < session.length; i += 1) {
          const storedKey = session.key(i);
          if (storedKey && storedKey.startsWith(activePrefix())) toRemove.push(storedKey);
        }
        toRemove.forEach((storedKey) => origRemove.call(session, storedKey));
        return;
      }
      origClear.call(this);
    };

    window.__compassDemoStorageInstalled = true;
  } catch (err) {
    console.warn('[demo] could not isolate storage for this session', err);
  }
}

export function installDemoStorageIfActive() {
  if (readFlag()) installDemoStorage();
}

/**
 * @param {'run'|'catalog'} scope  which drawer this session writes to. 'run' is
 *   a clickthrough and is left alone by the catalog; 'catalog' is the contact
 *   sheet, which resets itself constantly and must not be able to reach a run.
 */
export function startDemoSession(scope = DEFAULT_SCOPE) {
  const next = PREFIXES[scope] ? scope : DEFAULT_SCOPE;
  try {
    sessionStorage.setItem(SCOPE_KEY, next);
  } catch {
    /* ignore */
  }
  try {
    // Wipe whatever the last demo run left behind — in THIS scope only.
    // Without this, picking a second option in the same tab inherits the
    // first one's state: try the skip-ahead path and then the walk-it path,
    // and the campaign is already closed before you start.
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIXES[next]))
      .forEach((k) => sessionStorage.removeItem(k));
    sessionStorage.removeItem(STATIC_KEY);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(FLAG_KEY, '1');
  } catch {
    /* ignore */
  }
  installDemoStorage();
  try {
    window.dispatchEvent(new Event('compass-demo-change'));
  } catch {
    /* ignore */
  }
}

export function endDemoSession() {
  try {
    // Leaving the demo ends every drawer, not just the one that happens to be
    // open — otherwise a catalog visit could leave a run's storage behind it.
    const prefixes = Object.values(PREFIXES);
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const storedKey = sessionStorage.key(i);
      if (storedKey && prefixes.some((p) => storedKey.startsWith(p))) toRemove.push(storedKey);
    }
    toRemove.forEach((storedKey) => sessionStorage.removeItem(storedKey));
    sessionStorage.removeItem(FLAG_KEY);
    sessionStorage.removeItem(SCOPE_KEY);
  } catch {
    /* ignore */
  }
  window.location.href = '/';
}

/**
 * The full-experience path: unlock the demo and land on the profile step with
 * nothing filled in, so the leader gives their own context the way a customer
 * does. Anything pre-filled here would be answering for them.
 */
export function seedDemoBlankIntake() {
  localStorage.setItem('userInfo', JSON.stringify({ name: '', email: 'demo@local' }));
  localStorage.setItem('compassPaid', 'paid');
  localStorage.setItem('intakeDraft', JSON.stringify({
    draftVersion: 4,
    formData: { email: 'demo@local' },
    societalResponses: Array(10).fill(null),
    currentStep: 1,
    societalQuestionIndex: 0,
  }));
  localStorage.setItem('intakeStatus', JSON.stringify({
    started: true,
    complete: false,
    currentStep: 1,
    totalSteps: 28,
    updatedAt: new Date().toISOString(),
  }));
  try { localStorage.removeItem('cairn_profile_details_complete'); } catch { /* ignore */ }
}

export function seedDemoContext({ name, role, industry, teamSize } = {}) {
  const safeName = String(name || 'You').trim() || 'You';
  const safeRole = String(role || 'Team lead').trim() || 'Team lead';
  const safeIndustry = String(industry || 'Professional services').trim() || 'Professional services';
  const safeTeamSize = String(teamSize || '8').trim() || '8';
  const userInfo = {
    name: safeName,
    email: 'demo@local',
    role: safeRole,
    industry: safeIndustry,
    teamSize: safeTeamSize,
  };
  const formData = {
    name: safeName,
    email: 'demo@local',
    industry: safeIndustry,
    department: 'Leadership',
    role: safeRole,
    responsibilities: 'Lead a team and set direction.',
    birthYear: '1985',
    teamSize: safeTeamSize,
    leadershipExperience: '10',
    careerExperience: '15',
  };
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
  localStorage.setItem('compassPaid', 'paid');
  localStorage.setItem(
    'intakeDraft',
    JSON.stringify({
      draftVersion: 4,
      formData,
      societalResponses: Array(10).fill(null),
      currentStep: 3,
      societalQuestionIndex: 0,
    })
  );
  localStorage.setItem(
    'intakeStatus',
    JSON.stringify({
      started: true,
      complete: false,
      currentStep: 3,
      totalSteps: 19,
      updatedAt: new Date().toISOString(),
    })
  );
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * The second demo path: skip the intake entirely, land on the reflection.
 *
 * Fills a whole finished intake from one of the staging personas, picks a
 * guide at random so repeat runs do not all sound the same, and opens the
 * campaign so the dashboard rooms are reachable straight after the summary.
 * Returns the persona and guide so the caller can say what it chose.
 */
export function seedDemoPersona({ name, teamSize, closeCampaign = true } = {}) {
  const persona = pick(STAGING_PERSONAS);
  const guide = pick(SELECTABLE_GUIDE_PERSONAS);

  // 'Alex' rather than 'You': the seeded reflection, the guide lines and the
  // staging email are all written about Alex, so defaulting to 'You' gave one
  // demo two names for the same person — "Alex, cute story..." on the
  // reflection and "You, your team has reflected back" on the dashboard.
  const safeName = String(name || '').trim() || 'Alex';
  const societal = Array.isArray(persona.data?.societalResponses)
    ? persona.data.societalResponses
    : Array(10).fill(5);

  const formData = {
    ...persona.data,
    name: safeName,
    email: 'demo@local',
    teamSize: String(teamSize || persona.data?.teamSize || '8'),
    societalResponses: societal,
    guideId: guide.id,
    selectedAgent: guide.id,
  };

  localStorage.setItem('userInfo', JSON.stringify({
    name: safeName,
    email: 'demo@local',
    role: persona.data?.role || 'Team lead',
    industry: persona.data?.industry || 'Professional services',
    teamSize: formData.teamSize,
  }));
  localStorage.setItem('compassPaid', 'paid');
  localStorage.setItem('latestFormData', JSON.stringify(formData));
  localStorage.setItem('intakeDraft', JSON.stringify({
    draftVersion: 4,
    formData,
    societalResponses: societal,
    currentStep: 27,
    societalQuestionIndex: 9,
    intakeLock: { locked: true, lockedAt: new Date().toISOString(), lockedFrom: 'demo-persona' },
  }));
  localStorage.setItem('intakeStatus', JSON.stringify({
    started: true,
    complete: true,
    currentStep: 27,
    totalSteps: 28,
    updatedAt: new Date().toISOString(),
  }));

  // GuideContext reads these on mount, and the summary is generated in the
  // picked voice — so both have to be in place before the page loads.
  localStorage.setItem('selectedAgent', guide.id);
  localStorage.setItem('selectedGuideId', guide.id);
  localStorage.setItem('cairnGuide', JSON.stringify({ personaId: guide.id, selected: true, hidden: false }));

  // Seed a real summary rather than clearing and depending on a live
  // three-minute generation.
  //
  // Clearing it left the demo with no exit: campaign-builder redirects to
  // /form when aiSummary is missing, the persona's intake is locked, and the
  // only action on a locked ledger is "Read your reflection" — straight back
  // to the generation that had just failed. A demo cannot be one API error
  // away from a closed loop.
  //
  // Summary still regenerates over this when it can; this is the floor, not
  // the ceiling.
  try {
    localStorage.setItem('summariesByGuide', JSON.stringify(STAGING_GUIDE_SUMMARIES));
    localStorage.setItem('aiSummary', stagingFlattenedSummary(guide.id));
    // The per-screen lines, for the same reason as the summary above: without
    // them every room in the demo falls back to canned copy, and the catalog
    // shows the design with the guide switched off.
    localStorage.setItem('compassGuideLines', JSON.stringify({
      ...STAGING_GUIDE_LINES,
      __meta: { model: 'claude-opus-5', source: 'demo-fixture', basedOnResults: true },
    }));
  } catch { /* ignore */ }
  ['focusAreas', 'focusAreasSource', 'trailheadHighlights', 'summarySavedAt', 'aiCampaign']
    .forEach((key) => { try { localStorage.removeItem(key); } catch { /* ignore */ } });

  // Then put the five areas back.
  //
  // Clearing them alone left the demo unable to render the thing it exists to
  // show: Summary's static path needs a complete focus-area set as well as a
  // summary, and without one it stops on "Static staging summary data is
  // missing. Use the Stage Navigator reset" — a message naming a dev panel,
  // in front of whoever was being shown the product. Both seeded demo paths
  // died there. The clear above still matters: it drops a previous run's
  // areas so a second demo in the same tab cannot inherit them.
  persistFocusAreas(SEED_FOCUS_AREAS, 'seed');

  localStorage.setItem('selectedTraits', JSON.stringify([
    'communication-clarity',
    'execution-deadlineManagement',
    'strategicThinking-vision',
  ]));
  localStorage.setItem('currentCampaign', JSON.stringify(CAMPAIGN_TRAITS));
  // The campaign is on disk, so the builder must not try to generate one. A
  // demo that dies when an API does is not a demo.
  try { sessionStorage.setItem(STATIC_KEY, '1'); } catch { /* ignore */ }

  // The skip-ahead path wants the rooms open on arrival. The walk-it path
  // wants the campaign still live so there is something left to do.
  if (closeCampaign) finishDemoCampaign();
  return { persona, guide };
}

/**
 * The showcase path: the two things worth showing, and nothing in between.
 *
 * Everything is already on disk — a finished intake, a written reflection, a
 * closed campaign, and team answers — so the run needs no API, no waiting, and
 * no clicking through the middle. Land on the reflection, then the dashboard.
 *
 * This is the one to open in front of somebody.
 */
/**
 * The walk-it-without-the-wait path.
 *
 * Same finished intake and written reflection as the skip-ahead run, but the
 * campaign stays open — the reflection, the traits, and the campaign are the
 * parts worth showing, so they stay walkable. What gets skipped is the
 * assessment, via the button that appears once the campaign is built.
 */
export function seedDemoShowcase() {
  return seedDemoPersona({ closeCampaign: false });
}

/**
 * Skips the part of the demo nobody wants to sit through.
 *
 * The reflection and the campaign are worth walking — they are the product.
 * Answering fifteen statements about yourself and then waiting on a team that
 * does not exist is not. This closes the window with results already in place
 * and opens every room, so the run goes campaign → dashboard directly.
 *
 * Static on purpose: the dashboard reads team answers from fakeData in a demo
 * session regardless of which statements were built, so there is nothing to
 * compute and nothing to wait for.
 */
export function skipDemoToResults() {
  finishDemoCampaign();

  // Without this the rooms open gated behind one another, which is the walk
  // this button exists to avoid.
  const userInfo = parseJson(localStorage.getItem('userInfo'), {});
  const records = parseJson(localStorage.getItem('campaignRecords'), {});
  const campaignKey = records?.bundleId || records?.teamCampaignId || records?.selfCampaignId || '123';
  const userKey = userInfo?.email || userInfo?.name || 'anonymous';
  try {
    localStorage.setItem(
      `signalDebrief_${campaignKey}_${userKey}_done`,
      JSON.stringify({ signal: true, evidence: true, practice: false })
    );
    localStorage.setItem(
      `signalDebrief_${campaignKey}_${userKey}_pages`,
      JSON.stringify({ signal: 0, evidence: 0, practice: 0 })
    );
    // The self assessment is what the leader would have just answered.
    localStorage.setItem('selfCampaignCompleted', 'true');
    if (records?.selfCampaignId) {
      localStorage.setItem(`selfCampaignCompleted_${records.selfCampaignId}`, 'true');
    }
  } catch { /* ignore */ }
}

export function finishDemoCampaign() {
  const records = parseJson(localStorage.getItem('campaignRecords'), {});
  const now = new Date().toISOString();
  localStorage.setItem(
    'campaignRecords',
    JSON.stringify({
      ...records,
      selfCompleted: true,
      teamCampaignClosed: true,
      teamCampaignClosedAt: now,
    })
  );
  localStorage.setItem('selfCampaignCompleted', 'true');
  if (records.selfCampaignId) {
    localStorage.setItem(`selfCampaignCompleted_${records.selfCampaignId}`, 'true');
  }
  localStorage.setItem('teamCampaignCompleted', 'true');
}
