import { describe, expect, beforeEach, vi, it } from 'vitest';

const appMocks = vi.hoisted(() => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn((config) => ({ config })),
}));

const firestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(() => ({ name: 'firestore' })),
  collection: vi.fn(() => 'collection-ref'),
  doc: vi.fn(() => 'doc-ref'),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(async () => ({ id: 'generated' })),
  serverTimestamp: vi.fn(() => 'timestamp'),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(() => 'query-ref'),
  orderBy: vi.fn(() => 'order-by'),
  where: vi.fn(() => 'where'),
  limit: vi.fn(() => 'limit'),
  connectFirestoreEmulator: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  getStorage: vi.fn(() => ({ name: 'storage' })),
  ref: vi.fn(() => 'storage-ref'),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(async () => 'https://example.com/file.jpg'),
  connectStorageEmulator: vi.fn(),
}));

vi.mock('firebase/app', () => appMocks);
vi.mock('firebase/firestore', () => firestoreMocks);
vi.mock('firebase/storage', () => storageMocks);

import {
  bootstrapFirebase,
  fetchDocument,
  writeDocument,
  patchDocument,
  removeDocument,
  pushDocument,
  uploadFile,
  subscribeCollection,
} from '../lib/firebaseHelpers.js';

describe('firebaseHelpers', () => {
  beforeEach(() => {
    Object.values(appMocks).forEach((mock) => mock.mockClear());
    Object.values(firestoreMocks).forEach((mock) => mock.mockClear());
    Object.values(storageMocks).forEach((mock) => mock.mockClear());
  });

  it('initialises firebase when config present', () => {
    const config = {
      apiKey: 'key',
      projectId: 'id',
      appId: 'appid',
      authDomain: 'domain',
    };
    const { firestore, storage } = bootstrapFirebase(config);
    expect(appMocks.initializeApp).toHaveBeenCalledWith(config);
    expect(firestore).toEqual({ name: 'firestore' });
    expect(storage).toEqual({ name: 'storage' });
  });

  it('returns null handles when config missing', () => {
    const { firestore, storage } = bootstrapFirebase({});
    expect(firestore).toBeNull();
    expect(storage).toBeNull();
  });

  it('fetches document data when available', async () => {
    firestoreMocks.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'hello' }) });
    const data = await fetchDocument('firestore', 'collection', 'doc');
    expect(firestoreMocks.getDoc).toHaveBeenCalled();
    expect(data).toEqual({ title: 'hello' });
  });

  it('writes, updates and removes documents', async () => {
    await writeDocument('firestore', 'collection', 'doc', { title: 'hi' });
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith('doc-ref', { title: 'hi' }, { merge: true });

    await patchDocument('firestore', 'collection', 'doc', { title: 'update' });
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('doc-ref', { title: 'update' });

    await removeDocument('firestore', 'collection', 'doc');
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('doc-ref');
  });

  it('pushes document and returns generated id', async () => {
    const id = await pushDocument('firestore', 'memories', { name: 'entry' });
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith('collection-ref', { name: 'entry' });
    expect(id).toBe('generated');
  });

  it('uploads file and returns metadata', async () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await uploadFile('storage', file, { directory: 'memories', fileName: 'custom.jpg' });
    expect(storageMocks.uploadBytes).toHaveBeenCalledWith('storage-ref', file);
    expect(result).toEqual({ url: 'https://example.com/file.jpg', path: 'memories/custom.jpg' });
  });

  it('subscribes to collection and maps docs', () => {
    const unsubscribe = subscribeCollection(
      'firestore',
      'memories',
      { orderByField: 'timestamp', orderDirection: 'desc' },
      vi.fn()
    );
    expect(firestoreMocks.onSnapshot).toHaveBeenCalled();
    expect(typeof unsubscribe).toBe('function');
  });
});
