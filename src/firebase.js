import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCrAutEbLbhY4DP488dc2DqJCo43mt3nTo",
  authDomain: "leadership-evolution-project.firebaseapp.com",
  projectId: "leadership-evolution-project",
  storageBucket: "leadership-evolution-project.firebasestorage.app",
  messagingSenderId: "1081296339444",
  appId: "1:1081296339444:web:663edcc18eb023cf85f9a1",
  measurementId: "G-SYC0JYQ79D"
};

// Initialize app + services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export so components/pages can import { db }
export { auth, db };
