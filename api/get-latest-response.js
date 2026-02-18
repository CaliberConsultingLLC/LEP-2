import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { applyRateLimit, requireInternalKey, safeServerError } from './_security.js';

const firebaseConfig = {
  apiKey: "AIzaSyCrAutEbLbhY4DP488dc2DqJCo43mt3nTo",
  authDomain: "leadership-evolution-project.firebaseapp.com",
  projectId: "leadership-evolution-project",
  storageBucket: "leadership-evolution-project.firebasestorage.app",
  messagingSenderId: "1081296339444",
  appId: "1:1081296339444:web:663edcc18eb023cf85f9a1",
  measurementId: "G-SYC0JYQ79D"
};

// Avoid re-initializing Firebase if app already exists (important for serverless environments)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

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

    const q = query(collection(db, 'responses'), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
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