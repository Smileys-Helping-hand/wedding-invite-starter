import React, { createContext, useContext, useEffect, useState } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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

const firebaseValues = Object.values(firebaseConfig);
const hasFirebaseConfig = firebaseValues.every((value) => value && value !== '');

let app;
let db;
let storage;

if (hasFirebaseConfig) {
  const existingApps = getApps();
  app = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
}

export const FirebaseProvider = ({ children }) => {
  const [firestore, setFirestore] = useState(null);
  const [bucket, setBucket] = useState(null);

  useEffect(() => {
    if (db) setFirestore(db);
    if (storage) setBucket(storage);
  }, []);

  const getGuest = async (code) => {
    if (!firestore) return null;
    try {
      const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data();
      return null;
    } catch (err) {
      return null;
    }
  };

  const saveRSVP = async (code, updates) => {
    if (!firestore) return;
    try {
      const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
      await updateDoc(ref, updates);
    } catch (e) {
      /* no-op: offline fallback will retain local state */
    }
  };

  const addGuest = async (code, data) => {
    if (!firestore) return;
    const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
    await setDoc(ref, data);
  };

  const fetchThemeConfig = async () => {
    if (!firestore) return null;
    try {
      const ref = doc(firestore, 'config', 'currentTheme');
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      const data = snapshot.data();
      return data?.theme ?? data;
    } catch (err) {
      return null;
    }
  };

  const saveThemeConfig = async (theme) => {
    if (!firestore) throw new Error('Firestore unavailable');
    try {
      const ref = doc(firestore, 'config', 'currentTheme');
      await setDoc(ref, { theme }, { merge: true });
    } catch (err) {
      throw err;
    }
  };

  const uploadMedia = async (file, { directory = 'themes', fileName } = {}) => {
    if (!bucket) throw new Error('Firebase Storage unavailable');
    const safeName = fileName ?? `${Date.now()}-${file.name}`.replace(/\s+/g, '-');
    const objectPath = `${directory}/${safeName}`;
    const fileRef = storageRef(bucket, objectPath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return { url, path: objectPath };
  };

  return (
    <FirebaseContext.Provider
      value={{
        firestore,
        getGuest,
        saveRSVP,
        addGuest,
        fetchThemeConfig,
        saveThemeConfig,
        uploadMedia,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
