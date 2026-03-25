import crypto from 'crypto';

function getCampaignAccessSecret() {
  return process.env.CAMPAIGN_ACCESS_SECRET || process.env.INTERNAL_API_KEY || '';
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(encoded) {
  const raw = Buffer.from(String(encoded || ''), 'base64url').toString('utf8');
  return JSON.parse(raw);
}

function signEncodedPayload(encodedPayload) {
  return crypto
    .createHmac('sha256', getCampaignAccessSecret())
    .update(encodedPayload)
    .digest('base64url');
}

export function createCampaignAccessToken(campaignId, expiresInMs = 12 * 60 * 60 * 1000) {
  const secret = getCampaignAccessSecret();
  if (!secret) {
    throw new Error('Campaign access secret is not configured');
  }
  const payload = {
    campaignId: String(campaignId || ''),
    exp: Date.now() + expiresInMs,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyCampaignAccessToken(token, campaignId) {
  const secret = getCampaignAccessSecret();
  if (!secret) return false;
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return false;
  const [encodedPayload, signature] = parts;
  const expectedSignature = signEncodedPayload(encodedPayload);
  const validSignature = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
  if (!validSignature) return false;

  const payload = decodePayload(encodedPayload);
  if (!payload?.campaignId || payload.campaignId !== String(campaignId || '')) return false;
  if (typeof payload?.exp !== 'number' || Date.now() > payload.exp) return false;
  return true;
}
