import { STAGING_PERSONAS } from '../data/stagingPersonas';
import { CAMPAIGN_TRAITS } from './stagingSeed';
import { SELECTABLE_GUIDE_PERSONAS } from '../data/guidePersonas';

const FLAG_KEY = 'compassDemo';
const PREFIX = 'demo_';

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
        return origGet.call(session, PREFIX + String(key));
      }
      return origGet.call(this, key);
    };

    proto.setItem = function setItem(key, value) {
      if (readFlag() && this === window.localStorage) {
        origSet.call(session, PREFIX + String(key), String(value));
        return;
      }
      origSet.call(this, key, value);
    };

    proto.removeItem = function removeItem(key) {
      if (readFlag() && this === window.localStorage) {
        origRemove.call(session, PREFIX + String(key));
        return;
      }
      origRemove.call(this, key);
    };

    proto.clear = function clear() {
      if (readFlag() && this === window.localStorage) {
        const toRemove = [];
        for (let i = 0; i < session.length; i += 1) {
          const storedKey = session.key(i);
          if (storedKey && storedKey.startsWith(PREFIX)) toRemove.push(storedKey);
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

export function startDemoSession() {
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
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const storedKey = sessionStorage.key(i);
      if (storedKey && storedKey.startsWith(PREFIX)) toRemove.push(storedKey);
    }
    toRemove.forEach((storedKey) => sessionStorage.removeItem(storedKey));
    sessionStorage.removeItem(FLAG_KEY);
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
export function seedDemoPersona({ name, teamSize } = {}) {
  const persona = pick(STAGING_PERSONAS);
  const guide = pick(SELECTABLE_GUIDE_PERSONAS);

  const safeName = String(name || '').trim() || 'You';
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

  // A cached summary would replay instead of generating for this persona.
  ['aiSummary', 'summariesByGuide', 'focusAreas', 'trailheadHighlights', 'summarySavedAt', 'aiCampaign']
    .forEach((key) => { try { localStorage.removeItem(key); } catch { /* ignore */ } });

  localStorage.setItem('selectedTraits', JSON.stringify([
    'communication-clarity',
    'execution-deadlineManagement',
    'strategicThinking-vision',
  ]));
  localStorage.setItem('currentCampaign', JSON.stringify(CAMPAIGN_TRAITS));

  finishDemoCampaign();
  return { persona, guide };
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
