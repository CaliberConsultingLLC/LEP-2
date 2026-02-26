import { db } from './firebase.js';
import { applyRateLimit, requireInternalKey, safeServerError } from './_security.js';

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'test-firestore',
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!requireInternalKey(req, res)) {
    return;
  }

  try {
    console.log('Testing Firestore connection...');
    const snapshot = await db.collection('responses').get();
    const data = snapshot.docs.map(doc => doc.data());
    console.log('Test data:', data);
    res.status(200).json({ data, count: snapshot.size });
  } catch (error) {
    return safeServerError(res, 'test-firestore error:', error);
  }
};