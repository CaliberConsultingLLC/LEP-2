import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    console.log('Testing Firestore connection...');
    const snapshot = await getDocs(collection(db, 'responses'));
    const data = snapshot.docs.map(doc => doc.data());
    console.log('Test data:', data);
    res.status(200).json({ data, count: snapshot.size });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
};