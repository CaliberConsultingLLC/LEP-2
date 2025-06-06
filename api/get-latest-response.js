import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCrAutEbLbhY4DP488dc2DqJCo43mt3nTo",
  authDomain: "leadership-evolution-project.firebaseapp.com",
  projectId: "leadership-evolution-project",
  storageBucket: "leadership-evolution-project.firebasestorage.app",
  messagingSenderId: "1081296339444",
  appId: "1:1081296339444:web:663edcc18eb023cf85f9a1",
  measurementId: "G-SYC0JYQ79D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    console.log('Attempting Firestore query...');
    const q = query(collection(db, 'responses'), orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    console.log('Query result size:', querySnapshot.size);
    if (querySnapshot.empty) {
      console.log('No documents found, returning mock data');
      return res.status(200).json({ sample: "No real data available" });
    }
    const latestResponse = querySnapshot.docs[0].data();
    console.log('Fetched data:', latestResponse);
    res.status(200).json(latestResponse);
  } catch (error) {
    console.error('Firestore error:', error.message);
    res.status(500).json({ error: 'Failed to fetch response', details: error.message });
  }
};