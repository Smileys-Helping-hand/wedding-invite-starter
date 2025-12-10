import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
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

  const isReady = useMemo(() => Boolean(firestore), [firestore]);

  useEffect(() => {
    if (db) setFirestore(db);
    if (storage) setBucket(storage);
  }, []);

  const getGuest = async (code) => {
    if (!firestore || !code) return null;
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
    if (!firestore || !code) return;
    try {
      const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
      await updateDoc(ref, updates);
    } catch (e) {
      /* no-op: offline fallback will retain local state */
    }
  };

  const addGuest = async (code, data) => {
    if (!firestore || !code) return;
    const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
    await setDoc(ref, data, { merge: true });
  };

  const deleteGuest = async (code) => {
    if (!firestore || !code) return;
    try {
      const ref = doc(collection(firestore, 'guests'), code.toLowerCase());
      await deleteDoc(ref);
    } catch (err) {
      /* ignore removal errors for offline mode */
    }
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

  const subscribeToGuests = (callback) => {
    if (!firestore || typeof callback !== 'function') {
      return () => {};
    }

    const guestsQuery = query(collection(firestore, 'guests'), orderBy('primaryGuest', 'asc'));
    const unsubscribe = onSnapshot(
      guestsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({ code: docItem.id.toUpperCase(), ...docItem.data() }));
        callback(data);
      },
      () => {
        callback(null);
      }
    );

    return unsubscribe;
  };

  const appendAdminLog = async (payload) => {
    if (!firestore) return;
    const ref = doc(collection(firestore, 'adminLogs'));
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
    });
  };

  // Event Day Features (Optional Firebase sync - fallback to localStorage)
  const syncEventPhoto = async (photoData) => {
    if (!firestore || !bucket) return null;
    try {
      const ref = doc(collection(firestore, 'eventPhotos'));
      await setDoc(ref, {
        ...photoData,
        uploadedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (err) {
      // Fallback to localStorage only
      return null;
    }
  };

  const syncCheckIn = async (code, checkInData) => {
    if (!firestore) return;
    try {
      const ref = doc(collection(firestore, 'checkIns'), code.toLowerCase());
      await setDoc(ref, {
        ...checkInData,
        timestamp: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      // Fallback to localStorage only
    }
  };

  const syncGameGuess = async (guessData) => {
    if (!firestore) return null;
    try {
      const ref = doc(collection(firestore, 'eventGuesses'));
      await setDoc(ref, {
        ...guessData,
        submittedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (err) {
      // Fallback to localStorage only
      return null;
    }
  };

  const setEventDayMode = async (enabled) => {
    if (!firestore) return;
    try {
      const ref = doc(firestore, 'config', 'eventDayMode');
      await setDoc(ref, { enabled, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      // Fallback to localStorage only
    }
  };

  const getEventDayMode = async () => {
    if (!firestore) return null;
    try {
      const ref = doc(firestore, 'config', 'eventDayMode');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data().enabled;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const subscribeToEventDayMode = (callback) => {
    if (!firestore || typeof callback !== 'function') {
      return () => {};
    }

    const ref = doc(firestore, 'config', 'eventDayMode');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data().enabled);
        }
      },
      () => {
        // Error handler
      }
    );

    return unsubscribe;
  };

  return (
    <FirebaseContext.Provider
      value={{
        firestore,
        isReady,
        getGuest,
        saveRSVP,
        addGuest,
        deleteGuest,
        fetchThemeConfig,
        saveThemeConfig,
        uploadMedia,
        subscribeToGuests,
        appendAdminLog,
        // Event Day Features (optional sync)
        syncEventPhoto,
        syncCheckIn,
        syncGameGuess,
        setEventDayMode,
        getEventDayMode,
        subscribeToEventDayMode,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
