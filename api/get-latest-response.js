import { db } from './firebase.js';
import { applyRateLimit, requireInternalKey, safeServerError } from './_security.js';

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow GET requests
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const rate = applyRateLimit(req, res, {
    action: 'get-latest-response',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!requireInternalKey(req, res)) {
    return;
  }

  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firestore database not initialized');
      return res.status(500).json({ error: 'Internal server error' });
    }

    const querySnapshot = await db.collection('responses').orderBy('timestamp', 'desc').limit(1).get();
    
    if (querySnapshot.empty) {
      return res.status(200).json({ sample: "No real data available" });
    }
    
    const latestResponse = querySnapshot.docs[0].data();
    
    // Validate response data
    if (!latestResponse || typeof latestResponse !== 'object') {
      console.warn('Invalid response data structure');
      return res.status(200).json({ sample: "No valid data available" });
    }

    res.status(200).json(latestResponse);
  } catch (error) {
    console.error('Firestore error:', error);
    return safeServerError(res, 'Firestore error:', error);
  }
};