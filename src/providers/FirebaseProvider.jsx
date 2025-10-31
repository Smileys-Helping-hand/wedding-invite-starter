import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const FirebaseContext = createContext();
export const useFirebase = () => useContext(FirebaseContext);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn('Firebase already initialized or missing config', e);
}

export const FirebaseProvider = ({ children }) => {
  const [firestore, setFirestore] = useState(null);

  useEffect(() => {
    if (db) setFirestore(db);
  }, []);

  const getGuest = async (code) => {
    if (!firestore) return null;
    try {
      const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data();
      return null;
    } catch (err) {
      console.warn('Firestore lookup failed, falling back to local…', err);
      return null;
    }
  };

  const saveRSVP = async (code, updates) => {
    if (!firestore) return;
    try {
      const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
      await updateDoc(ref, updates);
    } catch (e) {
      console.warn('Failed to save RSVP to Firestore', e);
    }
  };

  const addGuest = async (code, data) => {
    if (!firestore) return;
    const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
    await setDoc(ref, data);
  };

  return (
    <FirebaseContext.Provider value={{ firestore, getGuest, saveRSVP, addGuest }}>
      {children}
    </FirebaseContext.Provider>
  );
};
