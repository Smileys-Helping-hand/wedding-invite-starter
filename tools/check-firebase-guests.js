// Check Firebase Guests Collection
// Run with: node tools/check-firebase-guests.js

import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

console.log('🔧 Connecting to Firebase...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkGuests() {
  try {
    console.log('📋 Fetching guests collection...');
    const guestsRef = collection(db, 'guests');
    const snapshot = await getDocs(guestsRef);

    if (snapshot.empty) {
      console.log('⚠️  No guests found in Firebase!');
      console.log('');
      console.log('This means:');
      console.log('1. The guests collection is empty, OR');
      console.log('2. You need to import your guests from the old site');
      console.log('');
      console.log('Next steps:');
      console.log('- Check your old production site\'s Firebase project');
      console.log('- Export data from old project and import here');
      console.log('- OR use the admin panel to add guests manually');
      return;
    }

    console.log(`✅ Found ${snapshot.size} guests in Firebase:\n`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  Code: ${doc.id.toUpperCase()}`);
      console.log(`  Name: ${data.primaryGuest || 'N/A'}`);
      console.log(`  Status: ${data.rsvpStatus || 'pending'}`);
      console.log(`  Household: ${data.householdCount || 1}`);
      console.log('  ---');
    });

    console.log('\n✅ Firebase connection successful!');
    console.log('Guests should appear in your admin panel.');
    
  } catch (error) {
    console.error('❌ Error fetching guests:');
    console.error(error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  Permission denied!');
      console.log('Check your Firebase Firestore rules.');
    }
  }
}

checkGuests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
