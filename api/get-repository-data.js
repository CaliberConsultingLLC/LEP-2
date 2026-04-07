import { db } from './firebase.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function getRepositorySessionToken() {
  return String(process.env.REPOSITORY_SESSION_TOKEN || '').trim();
}

function getEffectiveRepositorySessionToken() {
  const token = getRepositorySessionToken();
  if (token) return { token, mode: 'env' };
  return { token: '', mode: 'missing' };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function toIsoString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value?._seconds === 'number') {
    return new Date(value._seconds * 1000).toISOString();
  }
  return '';
}

function asNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function deriveUserStage({ intakeStarted, intakeComplete, summaryReady, campaignCount, responseCount }) {
  if (responseCount > 0) return 'Assessment Responses Collected';
  if (campaignCount > 0) return 'Campaign Created';
  if (summaryReady) return 'Summary Ready';
  if (intakeComplete) return 'Intake Complete';
  if (intakeStarted) return 'Intake In Progress';
  return 'Profile Created';
}

function deriveCurrentStepLabel(intakeStatus, stage) {
  if (intakeStatus?.complete) return 'Complete';
  const current = Number(intakeStatus?.currentStep);
  const total = Number(intakeStatus?.totalSteps);
  if (Number.isFinite(current) && Number.isFinite(total) && total > 0) {
    return `Step ${Math.min(current + 1, total)} of ${total}`;
  }
  return stage;
}

function deriveCampaignStatus(campaignType, responsesCount) {
  if (campaignType === 'self') {
    return responsesCount > 0 ? 'Self Assessment Submitted' : 'Self Assessment Ready';
  }
  if (responsesCount > 0) {
    return responsesCount === 1 ? '1 Team Response' : `${responsesCount} Team Responses`;
  }
  return 'Awaiting Team Responses';
}

function deriveWelcomeEmailStatus(ops) {
  const status = String(ops?.welcomeEmail?.status || '').trim();
  if (!status) return '—';
  return status === 'sent' ? 'Sent' : 'Failed';
}

function getTraitCount(campaign) {
  return Array.isArray(campaign) ? campaign.length : 0;
}

function getStatementCount(campaign) {
  if (!Array.isArray(campaign)) return 0;
  return campaign.reduce((sum, item) => sum + (Array.isArray(item?.statements) ? item.statements.length : 0), 0);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-repository-data',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;
    const session = getEffectiveRepositorySessionToken();
    if (!session.token) {
      return res.status(503).json({ error: 'Repository auth is not configured' });
    }
    const sessionToken = String(req.headers['x-repository-session'] || '').trim();
    if (!sessionToken || sessionToken !== session.token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [usersSnap, responsesSnap, campaignsSnap, surveyResponsesSnap, authEventsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('responses').get(),
      db.collection('campaigns').get(),
      db.collection('surveyResponses').get(),
      db.collection('authEvents').get(),
    ]);

    const surveyResponseCounts = {};
    surveyResponsesSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const campaignId = String(data?.campaignId || data?.id || '').trim();
      if (!campaignId) return;
      surveyResponseCounts[campaignId] = (surveyResponseCounts[campaignId] || 0) + 1;
    });

    const normalizedResponses = responsesSnap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      const latestFormData = data?.latestFormData || {};
      const intakeStatus = data?.intakeStatus || {};
      const summaryCache = data?.summaryCache || {};
      const campaignBundle = data?.campaignBundle || {};
      return {
        docId: docSnap.id,
        uid: String(data?.ownerUid || '').trim(),
        email: normalizeEmail(data?.ownerEmail || latestFormData?.email || data?.email),
        intakeStatus,
        summaryReady: Boolean(String(summaryCache?.aiSummary || '').trim()),
        summarySavedAt: toIsoString(summaryCache?.savedAt),
        campaignBundleReady: Boolean(campaignBundle?.campaignRecords),
        selfCompleted: Boolean(campaignBundle?.campaignRecords?.selfCompleted),
        welcomeEmailStatus: deriveWelcomeEmailStatus(data?.ops || {}),
        latestFormData,
        updatedAt: toIsoString(intakeStatus?.updatedAt || data?.timestamp),
      };
    });

    const responseByUid = new Map();
    const responseByEmail = new Map();
    normalizedResponses.forEach((row) => {
      if (row.uid && !responseByUid.has(row.uid)) responseByUid.set(row.uid, row);
      if (row.email && !responseByEmail.has(row.email)) responseByEmail.set(row.email, row);
    });

    const lastPasswordResetByEmail = new Map();
    authEventsSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() || {};
      if (String(data?.eventType || '').trim() !== 'password-reset') return;
      const email = normalizeEmail(data?.email);
      if (!email) return;
      const existing = lastPasswordResetByEmail.get(email);
      const nextStamp = toIsoString(data?.createdAt);
      if (!existing || String(nextStamp || '') > String(existing?.createdAt || '')) {
        lastPasswordResetByEmail.set(email, {
          status: String(data?.status || '').trim(),
          createdAt: nextStamp,
        });
      }
    });

    const campaignRowsRaw = campaignsSnap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      const email = normalizeEmail(data?.userInfo?.email);
      const uid = String(data?.userInfo?.uid || '').trim();
      const responsesCount = surveyResponseCounts[docSnap.id] || 0;
      return {
        campaignId: docSnap.id,
        uid,
        email,
        name: String(data?.userInfo?.name || '').trim(),
        bundleId: String(data?.bundleId || '').trim(),
        campaignType: String(data?.campaignType || '').trim() || 'team',
        campaignStatus: deriveCampaignStatus(String(data?.campaignType || '').trim(), responsesCount),
        responsesCount,
        traitsCount: getTraitCount(data?.campaign),
        statementsCount: getStatementCount(data?.campaign),
        createdAt: toIsoString(data?.createdAt),
        selfCampaignId: String(data?.selfCampaignId || '').trim(),
      };
    });

    const campaignCountsByUid = {};
    const campaignCountsByEmail = {};
    const responseCountsByUid = {};
    const responseCountsByEmail = {};
    campaignRowsRaw.forEach((row) => {
      if (row.uid) campaignCountsByUid[row.uid] = (campaignCountsByUid[row.uid] || 0) + 1;
      if (row.email) campaignCountsByEmail[row.email] = (campaignCountsByEmail[row.email] || 0) + 1;
      if (row.uid) responseCountsByUid[row.uid] = (responseCountsByUid[row.uid] || 0) + row.responsesCount;
      if (row.email) responseCountsByEmail[row.email] = (responseCountsByEmail[row.email] || 0) + row.responsesCount;
    });

    const userRows = usersSnap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      const uid = String(data?.uid || '').trim();
      const email = normalizeEmail(data?.email);
      const response = responseByUid.get(uid) || responseByEmail.get(email) || null;
      const intakeStatus = response?.intakeStatus || {};
      const intakeStarted = Boolean(intakeStatus?.started || response?.latestFormData);
      const intakeComplete = Boolean(intakeStatus?.complete || response?.latestFormData);
      const summaryReady = Boolean(response?.summaryReady);
      const campaignCount = campaignCountsByUid[uid] || campaignCountsByEmail[email] || 0;
      const responseCount = responseCountsByUid[uid] || responseCountsByEmail[email] || 0;
      const stage = deriveUserStage({
        intakeStarted,
        intakeComplete,
        summaryReady,
        campaignCount,
        responseCount,
      });

      return {
        id: docSnap.id,
        uid,
        name: String(data?.name || response?.latestFormData?.name || '').trim(),
        email,
        createdAt: toIsoString(data?.createdAt),
        currentStage: stage,
        currentStep: deriveCurrentStepLabel(intakeStatus, stage),
        role: String(response?.latestFormData?.role || '').trim(),
        industry: String(response?.latestFormData?.industry || '').trim(),
        teamSize: asNumber(response?.latestFormData?.teamSize),
        summaryReady,
        summarySavedAt: response?.summarySavedAt || '',
        campaignBundleReady: Boolean(response?.campaignBundleReady),
        selfCompleted: Boolean(response?.selfCompleted),
        welcomeEmailStatus: response?.welcomeEmailStatus || '—',
        lastPasswordResetAt: lastPasswordResetByEmail.get(email)?.createdAt || '',
        lastPasswordResetStatus: lastPasswordResetByEmail.get(email)?.status || '',
        campaignCount,
        responseCount,
      };
    }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    const campaignRows = campaignRowsRaw.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    return res.status(200).json({
      users: userRows,
      campaigns: campaignRows,
      meta: {
        userCount: userRows.length,
        campaignCount: campaignRows.length,
        accessMode: 'static-admin',
      },
    });
  } catch (error) {
    return safeServerError(res, 'get-repository-data error:', error);
  }
}
