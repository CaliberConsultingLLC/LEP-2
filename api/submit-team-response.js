import { db } from './firebase.js';
import { verifyCampaignAccessToken } from './_campaignAccess.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'submit-team-response',
    limit: 15,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const campaignId = String(req.body?.campaignId || '').trim();
    const accessToken = String(req.body?.accessToken || '').trim();
    const ratings = req.body?.ratings;
    if (!campaignId || !accessToken || !isObject(ratings)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    if (!verifyCampaignAccessToken(accessToken, campaignId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snap = await db.collection('campaigns').doc(campaignId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const data = snap.data() || {};
    if (String(data?.campaignType || '') !== 'team') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.collection('surveyResponses').add({
      id: campaignId,
      campaignId,
      campaignType: 'team',
      ownerId: data?.ownerId || null,
      ownerUid: data?.ownerUid || data?.userInfo?.uid || null,
      bundleId: data?.bundleId || null,
      submittedAt: new Date(),
      accessMode: 'anonymous-link',
      ratings,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return safeServerError(res, 'submit-team-response error:', error);
  }
}
