/* What the leader actually did, chapter by chapter.

   The journey map modal lists the specific things done in each chapter. The
   text and tone are fixed by the design; the completion state, the dates and
   the trait names come from the leader's own records. Where a record exists
   but was never stamped with a time, the date is simply omitted — the design
   only shows a date on a finished item, and inventing one would be worse than
   leaving the line bare. */

import { auth } from '../../../firebase';
import { getPersona } from '../../../data/guidePersonas';
import { readJourneyJson } from './journeyModel.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "12 Feb" — the inline stamp beside a finished item. */
export const shortDate = (value) => {
  const date = toDate(value);
  return date ? `${date.getDate()} ${MONTHS[date.getMonth()]}` : '';
};

/** "12 Feb 2026" — the folio kicker. */
export const longDate = (value) => {
  const date = toDate(value);
  return date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : '';
};

/** The earliest of the dates given — when the leader started. */
const earliest = (...values) => {
  const dates = values.map(toDate).filter(Boolean).sort((a, b) => a - b);
  return dates.length ? dates[0].toISOString() : '';
};

const readString = (key) => {
  try { return String(localStorage.getItem(key) || '').trim(); } catch { return ''; }
};

const readFlag = (key) => readString(key) === 'true';

/** Firebase stamps account creation; nothing in localStorage does. */
const accountCreatedAt = () => {
  try { return auth?.currentUser?.metadata?.creationTime || ''; } catch { return ''; }
};

/* --------------------------------------------------------------------------
   The scoped keys the debrief and the action plans are filed under. Both use
   the same campaign/user scoping as PracticeStudio and CommandCenter.
   -------------------------------------------------------------------------- */
const scopeKeys = (userInfo, campaignRecords) => {
  const userKey = String(userInfo?.email || userInfo?.name || userInfo?.uid || 'anonymous').trim() || 'anonymous';
  const campaignKey = String(
    campaignRecords?.bundleId
    || campaignRecords?.teamCampaignId
    || campaignRecords?.selfCampaignId
    || '123'
  );
  // getJourneyCompletion files plans under a slightly narrower key than the
  // debrief does; keep both so this reads the same buckets either writer made.
  const planKey = String(
    campaignRecords?.teamCampaignId
    || campaignRecords?.selfCampaignId
    || campaignRecords?.bundleId
    || 'current'
  );
  return { userKey, campaignKey, planKey };
};

/** The saved practice, if there is one: which trait, what was written, when. */
const readPractice = (plansByCampaign, userKey, keys) => {
  for (const campaignKey of keys) {
    const buckets = plansByCampaign?.[campaignKey]?.[userKey]?.plans || {};
    for (const [trait, subtraits] of Object.entries(buckets)) {
      for (const plan of Object.values(subtraits || {})) {
        const commitment = String(plan?.commitment || plan?.guidedAnswers?.behaviorCommitment || '').trim();
        const hasItems = Array.isArray(plan?.items) && plan.items.length > 0;
        if (commitment || hasItems) {
          return {
            trait,
            commitment,
            savedAt: plan?.savedAt || plan?.updatedAt || '',
          };
        }
      }
    }
  }
  return null;
};

/**
 * Chapter items built from the leader's records.
 *
 * Each item is `{ text, date, revisit, done, subs }`:
 *   text    — the line, in the design's voice
 *   date    — real stamp, or '' when nothing recorded one
 *   revisit — route for the Revisit pill, or undefined. 5A puts a pill on two
 *             lines only: the intake answers and the written reflection. Those
 *             are the things there is something to go back and *read*; the rest
 *             would offer to change a past decision from a map that is meant to
 *             be looked at.
 *   done    — whether this specific thing happened
 *   subs    — optional sub-bullets (the three chosen traits)
 *
 * `done` matters only at the chapter the leader is standing in. Earlier
 * chapters read as finished; later ones read as open.
 */
export function getJourneyChapterItems() {
  const userInfo = readJourneyJson('userInfo', {});
  const campaignRecords = readJourneyJson('campaignRecords', {});
  const intakeStatus = readJourneyJson('intakeStatus', {});
  const latestFormData = readJourneyJson('latestFormData', null);
  const currentCampaign = readJourneyJson('currentCampaign', []);
  const selectedTraits = readJourneyJson('selectedTraits', []);
  const plansByCampaign = readJourneyJson('actionPlansByCampaign', {});
  const { userKey, campaignKey, planKey } = scopeKeys(userInfo, campaignRecords);

  const debriefDone = readJourneyJson(`signalDebrief_${campaignKey}_${userKey}_done`, {});
  const narrativeRead = readJourneyJson(`signalDebrief_${campaignKey}_${userKey}_narrativeLaunched`, false);
  const practice = readPractice(plansByCampaign, userKey, [planKey, campaignKey]);

  const guideId = readString('selectedGuideId') || readString('cairnGuide');
  const guideName = getPersona(guideId)?.name || '';

  const accountAt = accountCreatedAt();
  const intakeAt = intakeStatus?.updatedAt || '';
  const summaryAt = readString('summarySavedAt');
  const campaignAt = campaignRecords?.createdAt || campaignRecords?.savedAt || '';
  const teamClosedAt = campaignRecords?.teamCampaignClosedAt || '';

  const hasAccount = Boolean(String(userInfo?.name || userInfo?.email || '').trim());
  const hasContext = readFlag('cairn_profile_details_complete') || Boolean(latestFormData);
  const intakeComplete = Boolean(intakeStatus?.complete || latestFormData);
  const reflectionRead = Boolean(readString('aiSummary'));

  // Display names beat the stored slugs: currentCampaign carries the trait as
  // it is written on screen ("Decision-Making & Judgment"), selectedTraits
  // carries the slug ("communication-clarity").
  const traitNames = (Array.isArray(currentCampaign) ? currentCampaign : [])
    .map((item) => String(item?.trait || item?.traitName || item?.title || '').trim())
    .filter(Boolean);
  const uniqueTraits = [...new Set(traitNames)];
  const traitsChosen = uniqueTraits.length > 0 || selectedTraits.length >= 3;
  const statementCount = (Array.isArray(currentCampaign) ? currentCampaign : [])
    .reduce((total, item) => total + (Array.isArray(item?.statements) ? item.statements.length : 0), 0);

  const campaignBuilt = statementCount > 0 || Boolean(campaignRecords?.bundleId);
  const selfDone = Boolean(
    campaignRecords?.selfCompleted
    || readFlag(`selfCampaignCompleted_${campaignRecords?.selfCampaignId || ''}`)
    || readFlag('selfCampaignCompleted')
  );
  const teamInvited = Boolean(campaignRecords?.teamCampaignId);
  const teamClosed = Boolean(campaignRecords?.teamCampaignClosed || readFlag('teamCampaignCompleted'));

  return [
    // I — Profile
    [
      { text: 'Set up your account', date: shortDate(accountAt), done: hasAccount },
      {
        text: guideName
          ? `Chose the ${guideName} as your guide for the year`
          : 'Chose your guide for the year',
        date: shortDate(accountAt),
        done: Boolean(guideId),
      },
      { text: 'Provided your leader context', date: shortDate(accountAt), done: hasContext },
    ],
    // II — Behaviors & Instincts
    [
      { text: 'Recorded your leadership instincts', date: shortDate(intakeAt), revisit: '/form', done: intakeComplete },
      { text: 'Considered your daily behaviors under pressure', date: shortDate(intakeAt), done: intakeComplete },
      { text: 'Named the habits your team sees most', date: shortDate(intakeAt), done: intakeComplete },
    ],
    // III — Reflection & Creation
    [
      { text: 'Read your written reflection', date: shortDate(summaryAt), revisit: '/summary', done: reflectionRead },
      {
        text: 'Identified three traits for your growth campaign',
        date: shortDate(summaryAt || campaignAt),
        done: traitsChosen,
        subs: uniqueTraits,
      },
      {
        text: statementCount
          ? `Finalized the build of your growth campaign, ${spellOut(statementCount)} statements`
          : 'Finalized the build of your growth campaign',
        date: shortDate(campaignAt),
        done: campaignBuilt,
      },
    ],
    // IV — Campaign Assessment
    [
      { text: 'Took your own growth campaign', date: shortDate(campaignAt), done: selfDone },
      { text: 'Invited your team to the growth campaign', date: shortDate(campaignAt), done: teamInvited },
      { text: 'Heard back from your team', date: shortDate(teamClosedAt), done: teamClosed },
      { text: 'Locked in your first campaign', date: shortDate(teamClosedAt), done: teamClosed },
    ],
    // V — Review & Reflect
    [
      { text: 'Read the Narrative of your first reading', date: '', done: Boolean(narrativeRead) },
      { text: 'Explored the Sentiment, trait by trait', date: '', done: Boolean(debriefDone?.signal) },
      { text: 'Walked the Evidence behind it, statement by statement', date: '', done: Boolean(debriefDone?.evidence) },
      { text: 'Opened your Field Journal', date: '', done: Boolean(debriefDone?.practice || practice) },
    ],
    // VI — Action Plan
    [
      {
        text: practice?.trait
          ? `Chose the trait to work on: ${practice.trait}`
          : 'Chose the trait to work on',
        date: shortDate(practice?.savedAt),
        done: Boolean(practice?.trait),
      },
      {
        text: 'Wrote the practice in one sentence',
        date: shortDate(practice?.savedAt),
        done: Boolean(practice?.commitment),
      },
      {
        text: 'Committed to it for the next eight weeks',
        date: shortDate(practice?.savedAt),
        done: Boolean(practice?.savedAt),
      },
    ],
    // VII — Check-In Assessment
    [
      { text: 'Ran the second reading with your team', date: '', done: false },
      { text: 'Compared it to the first, not to an ideal', date: '', done: false },
      { text: 'Noted where the practice showed up for them', date: '', done: false },
    ],
    // VIII — Revise Action Plan
    [
      { text: 'Kept what your team could feel', date: '', done: false },
      { text: 'Adjusted what they could not', date: '', done: false },
      { text: 'Set the plan for the final stretch', date: '', done: false },
    ],
    // IX — Final Assessment
    [
      { text: 'Ran the final reading of the year', date: '', done: false },
      { text: 'Named what changed, and what still asks for work', date: '', done: false },
      { text: 'Closed the year with your guide', date: '', done: false },
    ],
  ];
}

/** The design writes counts as words ("fifteen statements"), not digits. */
const NUMBER_WORDS = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty',
];
function spellOut(n) {
  return NUMBER_WORDS[n] || String(n);
}

/** When the journey began — the folio kicker's "Begun {date}". */
export function getJourneyBegunAt() {
  const intakeStatus = readJourneyJson('intakeStatus', {});
  const campaignRecords = readJourneyJson('campaignRecords', {});
  return earliest(
    accountCreatedAt(),
    intakeStatus?.updatedAt,
    readString('summarySavedAt'),
    campaignRecords?.createdAt,
  );
}
