/**
 * Initialize Firebase Event Day Mode
 * Run this once to create the initial Firebase config document
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAJSiCvixp6qb1M6wA7OmAd1N-ggs7MoF8',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'my-engagement-app-d5c34.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'my-engagement-app-d5c34',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'my-engagement-app-d5c34.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MSG_ID || '841646689739',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:841646689739:web:32cd28474cbe9951bdfa4e',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeEventDayMode() {
  try {
    console.log('Initializing Event Day Mode in Firebase...');
    
    const ref = doc(db, 'config', 'eventDayMode');
    await setDoc(ref, {
      enabled: false,
      updatedAt: serverTimestamp(),
      note: 'Toggle this in admin panel to enable Event Day features for guests'
    });
    
    console.log('✅ Event Day Mode initialized successfully!');
    console.log('   - Document: config/eventDayMode');
    console.log('   - Default state: disabled (false)');
    console.log('   - Toggle in admin panel to enable');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize Event Day Mode:', error);
    process.exit(1);
  }
}

initializeEventDayMode();
