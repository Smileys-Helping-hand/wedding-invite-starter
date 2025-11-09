import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  connectStorageEmulator,
} from 'firebase/storage';
import { getApps, initializeApp } from 'firebase/app';

/**
 * Initialise the Firebase application and optionally connect to emulators.
 * @param {object} config Firebase configuration values.
 * @param {{ useEmulator?: boolean }} options Additional initialisation options.
 * @returns {{ app: import('firebase/app').FirebaseApp|null, firestore: import('firebase/firestore').Firestore|null, storage: import('firebase/storage').FirebaseStorage|null }}
 */
export const bootstrapFirebase = (config, { useEmulator = false } = {}) => {
  const values = Object.values(config ?? {});
  const hasConfig = values.length > 0 && values.every((value) => value && value !== '');

  if (!hasConfig) {
    return { app: null, firestore: null, storage: null };
  }

  const existing = getApps();
  const app = existing.length ? existing[0] : initializeApp(config);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  if (useEmulator) {
    try {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    } catch (err) {
      console.warn('Failed to connect Firebase emulators', err);
    }
  }

  return { app, firestore, storage };
};

/**
 * Fetch a Firestore document by collection and id.
 * @param {import('firebase/firestore').Firestore} firestore Instance of Firestore.
 * @param {string} collectionName Collection name.
 * @param {string} id Document identifier.
 * @returns {Promise<any|null>} Document data or null if not found.
 */
export const fetchDocument = async (firestore, collectionName, id) => {
  if (!firestore || !collectionName || !id) return null;
  const ref = doc(collection(firestore, collectionName), id);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};

/**
 * Create or merge a Firestore document.
 * @param {import('firebase/firestore').Firestore} firestore Instance of Firestore.
 * @param {string} collectionName Collection name.
 * @param {string} id Document identifier.
 * @param {object} data Data to persist.
 * @param {{ merge?: boolean }} options Merge options.
 */
export const writeDocument = async (
  firestore,
  collectionName,
  id,
  data,
  { merge = true } = {}
) => {
  if (!firestore || !collectionName || !id) return;
  const ref = doc(collection(firestore, collectionName), id);
  await setDoc(ref, data, { merge });
};

/**
 * Update a Firestore document with partial data.
 * @param {import('firebase/firestore').Firestore} firestore Instance of Firestore.
 * @param {string} collectionName Collection name.
 * @param {string} id Document identifier.
 * @param {object} data Partial updates.
 */
export const patchDocument = async (firestore, collectionName, id, data) => {
  if (!firestore || !collectionName || !id) return;
  const ref = doc(collection(firestore, collectionName), id);
  await updateDoc(ref, data);
};

/**
 * Delete a Firestore document.
 * @param {import('firebase/firestore').Firestore} firestore Instance of Firestore.
 * @param {string} collectionName Collection name.
 * @param {string} id Document identifier.
 */
export const removeDocument = async (firestore, collectionName, id) => {
  if (!firestore || !collectionName || !id) return;
  const ref = doc(collection(firestore, collectionName), id);
  await deleteDoc(ref);
};

/**
 * Add a new document to a collection with a generated identifier.
 * @param {import('firebase/firestore').Firestore} firestore Instance of Firestore.
 * @param {string} collectionName Collection name.
 * @param {object} data Document payload.
 * @returns {Promise<string|null>} The generated id.
 */
export const pushDocument = async (firestore, collectionName, data) => {
  if (!firestore || !collectionName) return null;
  const ref = await addDoc(collection(firestore, collectionName), data);
  return ref.id;
};

/**
 * Upload a file to Firebase Storage and return the accessible URL.
 * @param {import('firebase/storage').FirebaseStorage} storage Firebase storage instance.
 * @param {File} file File to upload.
 * @param {{ directory?: string, fileName?: string }} options Storage options.
 * @returns {Promise<{ url: string, path: string }>} Uploaded file metadata.
 */
export const uploadFile = async (
  storage,
  file,
  { directory = 'uploads', fileName } = {}
) => {
  if (!storage || !file) throw new Error('Storage unavailable or missing file');
  const safeName = (
    fileName ?? `${Date.now()}-${file.name}`.replace(/\s+/g, '-')
  ).toLowerCase();
  const objectPath = `${directory}/${safeName}`;
  const reference = storageRef(storage, objectPath);
  await uploadBytes(reference, file);
  const url = await getDownloadURL(reference);
  return { url, path: objectPath };
};

/**
 * Subscribe to a Firestore query with optional filters.
 * @param {import('firebase/firestore').Firestore} firestore Instance of Firestore.
 * @param {string} collectionName Collection name.
 * @param {{ orderByField?: string, orderDirection?: 'asc'|'desc', limitTo?: number, filters?: Array<[string, import('firebase/firestore').WhereFilterOp, any]> }} options Query options.
 * @param {(docs: Array<{ id: string, data: any }> | null) => void} callback Subscription handler.
 * @returns {() => void} Unsubscribe function.
 */
export const subscribeCollection = (
  firestore,
  collectionName,
  { orderByField, orderDirection = 'asc', limitTo, filters = [] } = {},
  callback = () => {}
) => {
  if (!firestore || !collectionName) return () => {};

  const baseRef = collection(firestore, collectionName);
  const constraints = [];

  filters.forEach(([field, op, value]) => {
    constraints.push(where(field, op, value));
  });

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  if (limitTo) {
    constraints.push(limit(limitTo));
  }

  const q = constraints.length ? query(baseRef, ...constraints) : baseRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        data: docItem.data(),
      }));
      callback(docs);
    },
    (error) => {
      console.error('Firestore subscription error', error);
      callback(null);
    }
  );
};

/**
 * Returns a server timestamp placeholder.
 * @returns {import('firebase/firestore').FieldValue}
 */
export const now = () => serverTimestamp();
