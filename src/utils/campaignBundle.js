import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useCairnTheme } from '../config/runtimeFlags';
import { isDemoSession } from './demoMode';
import { isCampaignReady, normalizeCampaignItems } from './campaignState';

const parseJson = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const generatePassword = (length = 10) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
};

export const toSelfStatement = (statement) => {
  let text = String(statement || '').trim();
  if (!text) return '';

  text = text
    .replace(/\bmy leader\b/gi, 'I')
    .replace(/\bBrian\b/gi, 'I')
    .replace(/\bthe leader\b/gi, 'I')
    .replace(/\byour leader\b/gi, 'I')
    .replace(/\btheir\b/gi, 'my')
    .replace(/\bthem\b/gi, 'me')
    .replace(/\bthemselves\b/gi, 'myself')
    .replace(/\bthey\b/gi, 'I');

  if (!/\b(I|me|my|mine|myself)\b/i.test(text)) {
    const lowered = text.charAt(0).toLowerCase() + text.slice(1);
    text = `I ${lowered}`;
  }

  text = text.replace(/\bI\s+([a-z]+)s\b/gi, (_, verb) => `I ${verb}`);
  return text;
};

export const buildCampaignSignature = (campaign) => {
  const normalized = Array.isArray(campaign)
    ? campaign.map((traitItem) => ({
        traitId: traitItem?.traitId || '',
        traitName: traitItem?.traitName || '',
        title: traitItem?.title || '',
        statements: Array.isArray(traitItem?.statements)
          ? traitItem.statements.map((stmt) => String(stmt || '').trim())
          : [],
      }))
    : [];
  return JSON.stringify(normalized);
};

const stagingHost = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
const isStagingRuntime =
  stagingHost.includes('staging.northstarpartners.org')
  || stagingHost.includes('compass-staging');
const allowStagingPersistenceBypass = useCairnTheme || isStagingRuntime;

const buildCampaignLinks = (origin, records) => ({
  selfLink: `${origin}/campaign/${records.selfCampaignId}`,
  teamLink: `${origin}/campaign/${records.teamCampaignId}`,
});

const persistCampaignBundle = async ({ userInfo, campaignData, records }) => {
  const uid = String(auth?.currentUser?.uid || userInfo?.uid || '').trim();
  if (!uid) return;

  const normalizedRecords = {
    ...records,
    selfCompleted: Boolean(
      records?.selfCompleted
      || localStorage.getItem(`selfCampaignCompleted_${records?.selfCampaignId}`) === 'true'
    ),
    savedAt: new Date().toISOString(),
  };

  await setDoc(
    doc(db, 'responses', uid),
    {
      ownerUid: uid,
      ownerEmail: String(userInfo?.email || '').trim(),
      ownerName: String(userInfo?.name || '').trim(),
      campaignBundle: {
        campaignRecords: normalizedRecords,
        currentCampaign: Array.isArray(campaignData) ? campaignData : [],
        savedAt: normalizedRecords.savedAt,
      },
    },
    { merge: true }
  );
};

const writeLocalCampaignDocs = ({
  selfCampaignId,
  teamCampaignId,
  userInfo,
  ownerId,
  bundleId,
  selfCampaign,
  campaignData,
  selfPasswordGenerated,
  teamPasswordGenerated,
}) => {
  const localCampaignDocs = parseJson(localStorage.getItem('localCampaignDocs'), {});
  localCampaignDocs[selfCampaignId] = {
    userInfo,
    ownerId,
    ownerUid: userInfo?.uid || null,
    bundleId,
    campaignType: 'self',
    campaign: selfCampaign,
    password: selfPasswordGenerated,
    createdAt: new Date().toISOString(),
  };
  localCampaignDocs[teamCampaignId] = {
    userInfo,
    ownerId,
    ownerUid: userInfo?.uid || null,
    bundleId,
    campaignType: 'team',
    campaign: campaignData,
    password: teamPasswordGenerated,
    createdAt: new Date().toISOString(),
    selfCampaignId,
  };
  localStorage.setItem('localCampaignDocs', JSON.stringify(localCampaignDocs));
};

const cacheCampaignDocs = ({
  selfCampaignId,
  teamCampaignId,
  userInfo,
  ownerId,
  bundleId,
  selfCampaign,
  campaignData,
  selfPasswordGenerated,
  teamPasswordGenerated,
}) => {
  localStorage.setItem(`campaign_${selfCampaignId}`, JSON.stringify({
    userInfo,
    ownerId,
    ownerUid: userInfo?.uid || null,
    bundleId,
    campaignType: 'self',
    campaign: selfCampaign,
    password: selfPasswordGenerated,
    selfCampaignId,
    teamCampaignId,
    surveyClosed: false,
    createdAt: new Date().toISOString(),
  }));
  localStorage.setItem(`campaign_${teamCampaignId}`, JSON.stringify({
    userInfo,
    ownerId,
    ownerUid: userInfo?.uid || null,
    bundleId,
    campaignType: 'team',
    campaign: campaignData,
    password: teamPasswordGenerated,
    accessToken: allowStagingPersistenceBypass ? 'stage-team-token' : '',
    selfCampaignId,
    teamCampaignId,
    surveyClosed: false,
    createdAt: new Date().toISOString(),
  }));
  if (allowStagingPersistenceBypass) {
    localStorage.setItem(`teamCampaignAccess_${teamCampaignId}`, 'granted');
  }
};

const finalizeRecords = (records, campaignData, { lock = false } = {}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { selfLink, teamLink } = buildCampaignLinks(origin, records);
  const completed = Boolean(
    records?.selfCompleted
    || localStorage.getItem(`selfCampaignCompleted_${records.selfCampaignId}`) === 'true'
  );
  const next = {
    ...records,
    selfCompleted: completed,
    selfCampaignLink: records.selfCampaignLink || selfLink,
    teamCampaignLink: records.teamCampaignLink || teamLink,
    campaignLocked: Boolean(lock || records?.campaignLocked),
  };
  if (Array.isArray(campaignData) && campaignData.length) {
    localStorage.setItem('currentCampaign', JSON.stringify(campaignData));
  }
  localStorage.setItem('campaignRecords', JSON.stringify(next));
  localStorage.setItem('selfCampaignCompleted', completed ? 'true' : 'false');
  if (records?.selfCampaignId) {
    localStorage.setItem(`selfCampaignCompleted_${records.selfCampaignId}`, completed ? 'true' : 'false');
  }
  if (next.campaignLocked) {
    localStorage.setItem('campaignLocked', 'true');
  }
  return next;
};

export async function ensureCampaignBundle({ lock = false } = {}) {
  const userInfo = parseJson(localStorage.getItem('userInfo'), { name: '', email: '' });
  const ownerId = String(userInfo?.email || userInfo?.name || 'anonymous').trim().toLowerCase();
  const campaignData = normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), []));

  if (!isCampaignReady(campaignData)) {
    throw new Error('No campaign data found. Please return to the campaign builder.');
  }

  const selfCampaign = campaignData.map((traitItem) => ({
    ...traitItem,
    statements: (traitItem?.statements || []).map((stmt) => toSelfStatement(stmt)),
  }));
  const campaignSignature = buildCampaignSignature(campaignData);
  const existingRecords = parseJson(localStorage.getItem('campaignRecords'), null);
  const matchesExistingCampaign =
    existingRecords
    && existingRecords.ownerId === ownerId
    && existingRecords.campaignSignature === campaignSignature
    && existingRecords.selfCampaignId
    && existingRecords.teamCampaignId
    && existingRecords.selfCampaignPassword
    && existingRecords.teamCampaignPassword;

  if (matchesExistingCampaign) {
    const records = finalizeRecords(existingRecords, campaignData, { lock });
    persistCampaignBundle({ userInfo, campaignData, records }).catch((persistErr) => {
      console.warn('Failed to persist existing campaign bundle:', persistErr);
    });
    return { records, campaignData, userInfo };
  }

  const bundleId = `bundle_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const selfPasswordGenerated = generatePassword(8);
  const teamPasswordGenerated = generatePassword(8);

  let selfCampaignId = '';
  let teamCampaignId = '';

  if (isDemoSession()) {
    selfCampaignId = `demo-self-${bundleId}`;
    teamCampaignId = `demo-team-${bundleId}`;
    writeLocalCampaignDocs({
      selfCampaignId,
      teamCampaignId,
      userInfo,
      ownerId,
      bundleId,
      selfCampaign,
      campaignData,
      selfPasswordGenerated,
      teamPasswordGenerated,
    });
  } else if (allowStagingPersistenceBypass && !auth?.currentUser) {
    selfCampaignId = `stg-self-${bundleId}`;
    teamCampaignId = `stg-team-${bundleId}`;
    writeLocalCampaignDocs({
      selfCampaignId,
      teamCampaignId,
      userInfo,
      ownerId,
      bundleId,
      selfCampaign,
      campaignData,
      selfPasswordGenerated,
      teamPasswordGenerated,
    });
  } else {
    try {
      const selfDocRef = await addDoc(collection(db, 'campaigns'), {
        userInfo,
        ownerId,
        ownerUid: userInfo?.uid || null,
        bundleId,
        campaignType: 'self',
        campaign: selfCampaign,
        password: selfPasswordGenerated,
        createdAt: new Date(),
      });

      const teamDocRef = await addDoc(collection(db, 'campaigns'), {
        userInfo,
        ownerId,
        ownerUid: userInfo?.uid || null,
        bundleId,
        campaignType: 'team',
        campaign: campaignData,
        password: teamPasswordGenerated,
        createdAt: new Date(),
        selfCampaignId: selfDocRef.id,
      });
      selfCampaignId = selfDocRef.id;
      teamCampaignId = teamDocRef.id;
    } catch (persistErr) {
      const code = String(persistErr?.code || '').toLowerCase();
      const message = String(persistErr?.message || '').toLowerCase();
      const isPermissionErr = code.includes('permission-denied') || message.includes('insufficient permissions');
      if (!(allowStagingPersistenceBypass && isPermissionErr)) throw persistErr;

      selfCampaignId = `stg-self-${bundleId}`;
      teamCampaignId = `stg-team-${bundleId}`;
      writeLocalCampaignDocs({
        selfCampaignId,
        teamCampaignId,
        userInfo,
        ownerId,
        bundleId,
        selfCampaign,
        campaignData,
        selfPasswordGenerated,
        teamPasswordGenerated,
      });
      console.warn('[campaignBundle] Staging fallback activated: campaign docs stored locally.');
    }
  }

  cacheCampaignDocs({
    selfCampaignId,
    teamCampaignId,
    userInfo,
    ownerId,
    bundleId,
    selfCampaign,
    campaignData,
    selfPasswordGenerated,
    teamPasswordGenerated,
  });

  const selfLink = `${window.location.origin}/campaign/${selfCampaignId}`;
  const teamLink = `${window.location.origin}/campaign/${teamCampaignId}`;
  const completed = localStorage.getItem(`selfCampaignCompleted_${selfCampaignId}`) === 'true';
  const records = finalizeRecords({
    bundleId,
    ownerId,
    ownerUid: userInfo?.uid || null,
    campaignSignature,
    selfCampaignId,
    teamCampaignId,
    selfCampaignLink: selfLink,
    selfCampaignPassword: selfPasswordGenerated,
    teamCampaignLink: teamLink,
    teamCampaignPassword: teamPasswordGenerated,
    selfCompleted: completed,
    createdAt: new Date().toISOString(),
  }, campaignData, { lock });

  persistCampaignBundle({ userInfo, campaignData, records }).catch((persistErr) => {
    console.warn('Failed to persist campaign bundle:', persistErr);
  });

  return { records, campaignData, userInfo };
}

export function readCampaignRecords() {
  return parseJson(localStorage.getItem('campaignRecords'), {});
}

export function readLocalCampaignDoc(id) {
  const campaignId = String(id || '').trim();
  if (!campaignId) return null;
  const cached = parseJson(localStorage.getItem(`campaign_${campaignId}`), null);
  if (cached && cached.campaignType) return cached;
  const docs = parseJson(localStorage.getItem('localCampaignDocs'), {});
  const local = docs?.[campaignId];
  if (local && local.campaignType) return local;
  const records = parseJson(localStorage.getItem('campaignRecords'), {});
  if (String(records?.teamCampaignId || '').trim() !== campaignId) return null;
  return {
    campaignType: 'team',
    campaign: normalizeCampaignItems(parseJson(localStorage.getItem('currentCampaign'), [])),
    password: records.teamCampaignPassword || '',
    accessToken: allowStagingPersistenceBypass ? 'stage-team-token' : '',
    userInfo: parseJson(localStorage.getItem('userInfo'), {}),
    ownerId: records.ownerId || null,
    ownerUid: records.ownerUid || null,
    bundleId: records.bundleId || null,
    surveyClosed: false,
    selfCampaignId: records.selfCampaignId || '',
    teamCampaignId: campaignId,
  };
}
