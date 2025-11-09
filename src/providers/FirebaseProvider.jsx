import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  bootstrapFirebase,
  fetchDocument,
  writeDocument,
  patchDocument,
  removeDocument,
  pushDocument,
  uploadFile,
  subscribeCollection,
  now,
} from '../lib/firebaseHelpers.js';

const FirebaseContext = createContext();
export const useFirebase = () => useContext(FirebaseContext);

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn('⚠️ Firebase API key missing; verify .env before deploy.');
}

if (!import.meta.env.VITE_ADMIN_PASSWORD) {
  console.warn('⚠️ Admin password missing; set VITE_ADMIN_PASSWORD before deployment.');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const shouldUseEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

const { firestore: bootstrappedDb, storage: bootstrappedStorage } = bootstrapFirebase(
  firebaseConfig,
  { useEmulator: shouldUseEmulator }
);

export const FirebaseProvider = ({ children }) => {
  const [firestore, setFirestore] = useState(null);
  const [bucket, setBucket] = useState(null);

  const isReady = useMemo(() => Boolean(firestore), [firestore]);

  useEffect(() => {
    if (bootstrappedDb) setFirestore(bootstrappedDb);
    if (bootstrappedStorage) setBucket(bootstrappedStorage);
  }, []);

  const getGuest = async (code) => {
    try {
      return await fetchDocument(firestore, 'guests', code?.toLowerCase());
    } catch (err) {
      return null;
    }
  };

  const saveRSVP = async (code, updates) => {
    try {
      await patchDocument(firestore, 'guests', code?.toLowerCase(), updates);
    } catch (err) {
      /* offline safe: guest provider will revert on failure */
    }
  };

  const getInvite = async (code) => {
    try {
      return await fetchDocument(firestore, 'invites', code?.toLowerCase());
    } catch (err) {
      return null;
    }
  };

  const submitRSVPResponse = async (code, payload) => {
    try {
      await writeDocument(
        firestore,
        'responses',
        code?.toLowerCase(),
        { ...payload, timestamp: now() },
        { merge: true }
      );
    } catch (err) {
      /* ignore network issues to keep UI responsive */
    }
  };

  const addGuest = async (code, data) => {
    await writeDocument(firestore, 'guests', code?.toLowerCase(), data, { merge: true });
  };

  const deleteGuest = async (code) => {
    try {
      await removeDocument(firestore, 'guests', code?.toLowerCase());
    } catch (err) {
      /* ignore removal errors for offline mode */
    }
  };

  const fetchThemeConfig = async () => {
    try {
      const data = await fetchDocument(firestore, 'config', 'currentTheme');
      return data?.theme ?? data;
    } catch (err) {
      return null;
    }
  };

  const saveThemeConfig = async (theme) =>
    writeDocument(firestore, 'config', 'currentTheme', { theme });

  const uploadMedia = async (file, { directory = 'themes', fileName } = {}) =>
    uploadFile(bucket, file, { directory, fileName });

  const uploadMemoryImage = async (file) => uploadMedia(file, { directory: 'memories' });

  const subscribeToGuests = (callback) =>
    subscribeCollection(
      firestore,
      'guests',
      { orderByField: 'primaryGuest', orderDirection: 'asc' },
      (docs) => {
        if (!docs) {
          callback(null);
          return;
        }

        callback(docs.map((entry) => ({ code: entry.id.toUpperCase(), ...entry.data })));
      }
    );

  const subscribeToMemories = (callback, { limitTo = 50, onlyApproved = false } = {}) => {
    const filters = [];
    if (onlyApproved) {
      filters.push(['approved', '==', true]);
    }

    return subscribeCollection(
      firestore,
      'memories',
      { orderByField: 'timestamp', orderDirection: 'desc', limitTo, filters },
      (docs) => {
        if (!docs) {
          callback(null);
          return;
        }

        callback(docs.map((entry) => ({ id: entry.id, ...entry.data })));
      }
    );
  };

  const addMemory = async (payload) => {
    if (!firestore) throw new Error('Firestore unavailable');
    await pushDocument(firestore, 'memories', {
      ...payload,
      approved: payload.approved ?? import.meta.env.VITE_MEMORY_APPROVAL !== 'true',
      timestamp: now(),
    });
  };

  const updateMemory = async (id, updates) => {
    if (!firestore || !id) return;
    await patchDocument(firestore, 'memories', id, updates);
  };

  const deleteMemory = async (id) => {
    if (!firestore || !id) return;
    await removeDocument(firestore, 'memories', id);
  };

  const appendAdminLog = async (payload) => {
    if (!firestore) return;
    await pushDocument(firestore, 'adminLogs', {
      ...payload,
      createdAt: now(),
    });
  };

  return (
    <FirebaseContext.Provider
      value={{
        firestore,
        db: firestore,
        isReady,
        getGuest,
        getInvite,
        saveRSVP,
        submitRSVPResponse,
        addGuest,
        deleteGuest,
        fetchThemeConfig,
        saveThemeConfig,
        uploadMedia,
        uploadMemoryImage,
        subscribeToGuests,
        subscribeToMemories,
        addMemory,
        updateMemory,
        deleteMemory,
        appendAdminLog,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
