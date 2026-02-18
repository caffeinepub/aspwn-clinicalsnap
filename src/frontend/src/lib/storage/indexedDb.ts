// IndexedDB persistence layer for all clinical data

const DB_NAME = 'ClinicalSnapDB';
const DB_VERSION = 1;

export interface DBSchema {
  patients: Patient;
  sessions: Session;
  photos: Photo;
  annotations: Annotation;
  pairings: BeforeAfterPairing;
  treatmentTypes: TreatmentType;
  voiceMemos: VoiceMemo;
  settings: { key: string; value: any };
}

import type {
  Patient,
  Session,
  Photo,
  Annotation,
  BeforeAfterPairing,
  TreatmentType,
  VoiceMemo,
  AppSettings,
} from '../models';

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('patientId', 'patientId', { unique: false });
        }
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('sessionId', 'sessionId', { unique: false });
          photoStore.createIndex('patientId', 'patientId', { unique: false });
        }
        if (!db.objectStoreNames.contains('annotations')) {
          const annotationStore = db.createObjectStore('annotations', { keyPath: 'id' });
          annotationStore.createIndex('photoId', 'photoId', { unique: false });
        }
        if (!db.objectStoreNames.contains('pairings')) {
          const pairingStore = db.createObjectStore('pairings', { keyPath: 'id' });
          pairingStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('treatmentTypes')) {
          db.createObjectStore('treatmentTypes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('voiceMemos')) {
          const memoStore = db.createObjectStore('voiceMemos', { keyPath: 'id' });
          memoStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private getStore<T extends keyof DBSchema>(
    storeName: T,
    mode: IDBTransactionMode = 'readonly'
  ): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic CRUD operations
  async getAll<T extends keyof DBSchema>(storeName: T): Promise<DBSchema[T][]> {
    const store = this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T extends keyof DBSchema>(storeName: T, id: string): Promise<DBSchema[T] | undefined> {
    const store = this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T extends keyof DBSchema>(
    storeName: T,
    indexName: string,
    value: string
  ): Promise<DBSchema[T][]> {
    const store = this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T extends keyof DBSchema>(storeName: T, value: DBSchema[T]): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete<T extends keyof DBSchema>(storeName: T, id: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings helpers
  async getSetting(key: string): Promise<any> {
    const store = this.getStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async putSetting(key: string, value: any): Promise<void> {
    const store = this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new IndexedDBStorage();
