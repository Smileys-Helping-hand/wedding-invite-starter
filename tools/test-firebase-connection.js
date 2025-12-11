// Quick Firebase Connection Test
// Run with: node tools/test-firebase-connection.js

import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MSG_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('🔧 Testing Firebase Connection...\n');
console.log('Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});
console.log('');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  try {
    // Test 1: Check guests collection
    console.log('📋 Test 1: Checking guests collection...');
    const guestsRef = collection(db, 'guests');
    const guestsSnapshot = await getDocs(guestsRef);
    console.log(`✅ Found ${guestsSnapshot.size} guests`);
    console.log('');

    // Test 2: Check eventDayMode document
    console.log('🎯 Test 2: Checking eventDayMode config...');
    const configRef = doc(db, 'config', 'eventDayMode');
    const configSnapshot = await getDoc(configRef);
    if (configSnapshot.exists()) {
      console.log('✅ Event Day config exists:', configSnapshot.data());
    } else {
      console.log('⚠️  Event Day config does not exist');
    }
    console.log('');

    // Test 3: Check config collection
    console.log('⚙️  Test 3: Checking config collection...');
    const configColRef = collection(db, 'config');
    const configColSnapshot = await getDocs(configColRef);
    console.log(`✅ Found ${configColSnapshot.size} config documents:`);
    configColSnapshot.forEach((doc) => {
      console.log(`  - ${doc.id}`);
    });
    console.log('');

    console.log('✅ All Firebase tests passed!');
    console.log('\nYour Vercel site should be able to connect to Firebase.');
    console.log('If guests still show 0, check:');
    console.log('1. Vercel environment variables are set correctly');
    console.log('2. Clear browser localStorage and reload');
    console.log('3. Check browser console for Firebase errors');

  } catch (error) {
    console.error('❌ Firebase connection test failed:');
    console.error(error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied - check Firestore rules');
    } else if (error.code === 'unavailable') {
      console.log('\n⚠️  Firebase unavailable - check network connection');
    }
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
