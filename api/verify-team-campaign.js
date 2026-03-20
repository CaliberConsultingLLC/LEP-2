import { db } from './firebase.js';
import { createCampaignAccessToken } from './_campaignAccess.js';
import { applyRateLimit, ensureJsonObjectBody, safeServerError } from './_security.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'verify-team-campaign',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    if (!ensureJsonObjectBody(req, res)) return;

    const campaignId = String(req.body?.campaignId || '').trim();
    const password = String(req.body?.password || '');
    if (!campaignId || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const snap = await db.collection('campaigns').doc(campaignId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const data = snap.data() || {};
    if (String(data?.campaignType || '') !== 'team') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (String(data?.password || '') !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const campaign = {
      campaignType: 'team',
      campaign: Array.isArray(data?.campaign) ? data.campaign : [],
      ownerId: data?.ownerId || null,
      ownerUid: data?.ownerUid || data?.userInfo?.uid || null,
      bundleId: data?.bundleId || null,
      userInfo: {
        uid: data?.userInfo?.uid || data?.ownerUid || null,
        name: data?.userInfo?.name || '',
      },
    };

    return res.status(200).json({
      campaign,
      accessToken: createCampaignAccessToken(campaignId),
    });
  } catch (error) {
    return safeServerError(res, 'verify-team-campaign error:', error);
  }
}
