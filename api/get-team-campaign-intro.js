import { db } from './firebase.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-team-campaign-intro',
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const campaignId = String(req.body?.campaignId || '').trim();
    if (!campaignId) {
      return res.status(400).json({ error: 'Missing campaignId' });
    }

    const snap = await db.collection('campaigns').doc(campaignId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const data = snap.data() || {};
    if (String(data?.campaignType || '') !== 'team') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json({
      campaign: {
        id: campaignId,
        campaignType: 'team',
        bundleId: String(data?.bundleId || '').trim(),
        ownerId: String(data?.ownerId || '').trim(),
        ownerUid: String(data?.ownerUid || data?.userInfo?.uid || '').trim(),
        ownerName: String(data?.userInfo?.name || '').trim(),
        surveyClosed: Boolean(data?.surveyClosed),
        statementsReady: Array.isArray(data?.campaign) && data.campaign.length > 0,
      },
    });
  } catch (error) {
    return safeServerError(res, 'get-team-campaign-intro error:', error);
  }
}
