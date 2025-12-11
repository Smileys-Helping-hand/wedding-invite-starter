/**
 * Firebase Event Day Toggle Initializer
 * 
 * This script manually sets the Event Day toggle in Firebase.
 * Run this once to initialize the config/eventDayMode document.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MSG_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeEventDayToggle(enabled = false) {
  try {
    console.log('🔧 Initializing Event Day toggle in Firebase...');
    console.log(`Setting enabled to: ${enabled}`);
    
    const ref = doc(db, 'config', 'eventDayMode');
    await setDoc(ref, {
      enabled,
      updatedAt: new Date().toISOString(),
    });
    
    console.log('✅ Event Day toggle initialized successfully!');
    console.log(`Document path: config/eventDayMode`);
    console.log(`Enabled: ${enabled}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing toggle:', error);
    process.exit(1);
  }
}

// Get command line argument (true/false)
const enableArg = process.argv[2];
const enabled = enableArg === 'true' || enableArg === '1' || enableArg === 'on';

console.log('Firebase Event Day Toggle Initializer');
console.log('=====================================\n');
initializeEventDayToggle(enabled);
