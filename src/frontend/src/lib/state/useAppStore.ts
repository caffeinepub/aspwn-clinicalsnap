// Global app state management using Zustand with MIME-aware voice memo support, immediate state updates after IndexedDB writes, and photo update action for local-only edits

import { create } from 'zustand';
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
import { getSessionTreatmentIds } from '../models';
import { db } from '../storage/indexedDb';

interface AppState {
  // Data
  patients: Patient[];
  sessions: Session[];
  photos: Photo[];
  annotations: Annotation[];
  pairings: BeforeAfterPairing[];
  treatmentTypes: TreatmentType[];
  voiceMemos: VoiceMemo[];
  settings: AppSettings | null;

  // UI State
  selectedPatientId: string | null;
  selectedSessionId: string | null;
  selectedPhotoId: string | null;
  selectedPairingId: string | null;

  // Loading
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadData: () => Promise<void>;
  
  // Patient actions
  createPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Patient>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  selectPatient: (id: string | null) => void;

  // Session actions
  createSession: (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Session>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  selectSession: (id: string | null) => void;

  // Photo actions
  createPhoto: (photo: Omit<Photo, 'id'>) => Promise<Photo>;
  updatePhoto: (id: string, updates: Partial<Photo>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  selectPhoto: (id: string | null) => void;

  // Annotation actions
  createAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Annotation>;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  deleteAnnotationsByPhoto: (photoId: string) => Promise<void>;

  // Pairing actions
  createPairing: (pairing: Omit<BeforeAfterPairing, 'id' | 'createdAt'>) => Promise<BeforeAfterPairing>;
  deletePairing: (id: string) => Promise<void>;
  selectPairing: (id: string | null) => void;

  // Treatment type actions
  createTreatmentType: (type: Omit<TreatmentType, 'id' | 'createdAt'>) => Promise<TreatmentType>;
  updateTreatmentType: (id: string, updates: Partial<TreatmentType>) => Promise<void>;
  deleteTreatmentType: (id: string) => Promise<void>;

  // Voice memo actions
  createVoiceMemo: (memo: Omit<VoiceMemo, 'id' | 'createdAt'>) => Promise<VoiceMemo>;
  deleteVoiceMemo: (id: string) => Promise<void>;

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

// Normalize session on load to ensure treatmentTypeIds is always present
function normalizeSession(session: Session): Session {
  const treatmentIds = getSessionTreatmentIds(session);
  return {
    ...session,
    treatmentTypeIds: treatmentIds,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  patients: [],
  sessions: [],
  photos: [],
  annotations: [],
  pairings: [],
  treatmentTypes: [],
  voiceMemos: [],
  settings: null,
  selectedPatientId: null,
  selectedSessionId: null,
  selectedPhotoId: null,
  selectedPairingId: null,
  isLoading: false,
  isInitialized: false,

  // Load all data from IndexedDB
  loadData: async () => {
    set({ isLoading: true });
    try {
      const [patients, sessionsRaw, photos, annotations, pairings, treatmentTypes, voiceMemos, settings] =
        await Promise.all([
          db.getAll('patients'),
          db.getAll('sessions'),
          db.getAll('photos'),
          db.getAll('annotations'),
          db.getAll('pairings'),
          db.getAll('treatmentTypes'),
          db.getAll('voiceMemos'),
          db.getSetting('appSettings'),
        ]);

      // Normalize sessions to ensure treatmentTypeIds is present
      const sessions = sessionsRaw.map(normalizeSession);

      set({
        patients,
        sessions,
        photos,
        annotations,
        pairings,
        treatmentTypes,
        voiceMemos,
        settings: settings || null,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      set({ isLoading: false });
    }
  },

  // Patient actions
  createPatient: async (patientData) => {
    const now = Date.now();
    const patient: Patient = {
      id: crypto.randomUUID(),
      ...patientData,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('patients', patient);
    set((state) => ({ patients: [...state.patients, patient] }));
    return patient;
  },

  updatePatient: async (id, updates) => {
    const patient = get().patients.find((p) => p.id === id);
    if (!patient) return;
    const updated = { ...patient, ...updates, updatedAt: Date.now() };
    await db.put('patients', updated);
    set((state) => ({
      patients: state.patients.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deletePatient: async (id) => {
    // Cascade delete sessions, photos, annotations, pairings, and voice memos
    const sessionsToDelete = get().sessions.filter((s) => s.patientId === id);
    const sessionIds = sessionsToDelete.map((s) => s.id);
    const photosToDelete = get().photos.filter((p) => p.patientId === id);
    const photoIds = photosToDelete.map((p) => p.id);

    await Promise.all([
      db.delete('patients', id),
      ...sessionsToDelete.map((s) => db.delete('sessions', s.id)),
      ...photosToDelete.map((p) => db.delete('photos', p.id)),
      ...get()
        .annotations.filter((a) => photoIds.includes(a.photoId))
        .map((a) => db.delete('annotations', a.id)),
      ...get()
        .pairings.filter((p) => sessionIds.includes(p.sessionId))
        .map((p) => db.delete('pairings', p.id)),
      ...get()
        .voiceMemos.filter((v) => sessionIds.includes(v.sessionId))
        .map((v) => db.delete('voiceMemos', v.id)),
    ]);

    set((state) => ({
      patients: state.patients.filter((p) => p.id !== id),
      sessions: state.sessions.filter((s) => s.patientId !== id),
      photos: state.photos.filter((p) => p.patientId !== id),
      annotations: state.annotations.filter((a) => !photoIds.includes(a.photoId)),
      pairings: state.pairings.filter((p) => !sessionIds.includes(p.sessionId)),
      voiceMemos: state.voiceMemos.filter((v) => !sessionIds.includes(v.sessionId)),
      selectedPatientId: state.selectedPatientId === id ? null : state.selectedPatientId,
    }));
  },

  selectPatient: (id) => set({ selectedPatientId: id }),

  // Session actions
  createSession: async (sessionData) => {
    const now = Date.now();
    const session: Session = {
      id: crypto.randomUUID(),
      ...sessionData,
      createdAt: now,
      updatedAt: now,
    };
    const normalized = normalizeSession(session);
    await db.put('sessions', session);
    set((state) => ({ sessions: [...state.sessions, normalized] }));
    return normalized;
  },

  updateSession: async (id, updates) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session) return;
    const updated = { ...session, ...updates, updatedAt: Date.now() };
    const normalized = normalizeSession(updated);
    await db.put('sessions', updated);
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? normalized : s)),
    }));
  },

  deleteSession: async (id) => {
    // Cascade delete photos, annotations, pairings, and voice memos
    const photosToDelete = get().photos.filter((p) => p.sessionId === id);
    const photoIds = photosToDelete.map((p) => p.id);

    await Promise.all([
      db.delete('sessions', id),
      ...photosToDelete.map((p) => db.delete('photos', p.id)),
      ...get()
        .annotations.filter((a) => photoIds.includes(a.photoId))
        .map((a) => db.delete('annotations', a.id)),
      ...get()
        .pairings.filter((p) => p.sessionId === id)
        .map((p) => db.delete('pairings', p.id)),
      ...get()
        .voiceMemos.filter((v) => v.sessionId === id)
        .map((v) => db.delete('voiceMemos', v.id)),
    ]);

    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      photos: state.photos.filter((p) => p.sessionId !== id),
      annotations: state.annotations.filter((a) => !photoIds.includes(a.photoId)),
      pairings: state.pairings.filter((p) => p.sessionId !== id),
      voiceMemos: state.voiceMemos.filter((v) => v.sessionId !== id),
      selectedSessionId: state.selectedSessionId === id ? null : state.selectedSessionId,
    }));
  },

  selectSession: (id) => set({ selectedSessionId: id }),

  // Photo actions
  createPhoto: async (photoData) => {
    const photo: Photo = {
      id: crypto.randomUUID(),
      ...photoData,
    };
    await db.put('photos', photo);
    set((state) => ({ photos: [...state.photos, photo] }));
    return photo;
  },

  updatePhoto: async (id, updates) => {
    const photo = get().photos.find((p) => p.id === id);
    if (!photo) return;
    const updated = { ...photo, ...updates };
    await db.put('photos', updated);
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deletePhoto: async (id) => {
    // Cascade delete annotations
    await Promise.all([
      db.delete('photos', id),
      ...get()
        .annotations.filter((a) => a.photoId === id)
        .map((a) => db.delete('annotations', a.id)),
    ]);

    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      annotations: state.annotations.filter((a) => a.photoId !== id),
      selectedPhotoId: state.selectedPhotoId === id ? null : state.selectedPhotoId,
    }));
  },

  selectPhoto: (id) => set({ selectedPhotoId: id }),

  // Annotation actions
  createAnnotation: async (annotationData) => {
    const now = Date.now();
    const annotation: Annotation = {
      id: crypto.randomUUID(),
      ...annotationData,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('annotations', annotation);
    set((state) => ({ annotations: [...state.annotations, annotation] }));
    return annotation;
  },

  updateAnnotation: async (id, updates) => {
    const annotation = get().annotations.find((a) => a.id === id);
    if (!annotation) return;
    const updated = { ...annotation, ...updates, updatedAt: Date.now() };
    await db.put('annotations', updated);
    set((state) => ({
      annotations: state.annotations.map((a) => (a.id === id ? updated : a)),
    }));
  },

  deleteAnnotation: async (id) => {
    await db.delete('annotations', id);
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    }));
  },

  deleteAnnotationsByPhoto: async (photoId) => {
    const annotationsToDelete = get().annotations.filter((a) => a.photoId === photoId);
    await Promise.all(annotationsToDelete.map((a) => db.delete('annotations', a.id)));
    set((state) => ({
      annotations: state.annotations.filter((a) => a.photoId !== photoId),
    }));
  },

  // Pairing actions
  createPairing: async (pairingData) => {
    const pairing: BeforeAfterPairing = {
      id: crypto.randomUUID(),
      ...pairingData,
      createdAt: Date.now(),
    };
    await db.put('pairings', pairing);
    set((state) => ({ pairings: [...state.pairings, pairing] }));
    return pairing;
  },

  deletePairing: async (id) => {
    await db.delete('pairings', id);
    set((state) => ({
      pairings: state.pairings.filter((p) => p.id !== id),
      selectedPairingId: state.selectedPairingId === id ? null : state.selectedPairingId,
    }));
  },

  selectPairing: (id) => set({ selectedPairingId: id }),

  // Treatment type actions
  createTreatmentType: async (typeData) => {
    const treatmentType: TreatmentType = {
      id: crypto.randomUUID(),
      ...typeData,
      createdAt: Date.now(),
    };
    await db.put('treatmentTypes', treatmentType);
    set((state) => ({ treatmentTypes: [...state.treatmentTypes, treatmentType] }));
    return treatmentType;
  },

  updateTreatmentType: async (id, updates) => {
    const treatmentType = get().treatmentTypes.find((t) => t.id === id);
    if (!treatmentType) return;
    const updated = { ...treatmentType, ...updates };
    await db.put('treatmentTypes', updated);
    set((state) => ({
      treatmentTypes: state.treatmentTypes.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTreatmentType: async (id) => {
    await db.delete('treatmentTypes', id);
    set((state) => ({
      treatmentTypes: state.treatmentTypes.filter((t) => t.id !== id),
    }));
  },

  // Voice memo actions
  createVoiceMemo: async (memoData) => {
    const memo: VoiceMemo = {
      id: crypto.randomUUID(),
      ...memoData,
      createdAt: Date.now(),
    };
    await db.put('voiceMemos', memo);
    set((state) => ({ voiceMemos: [...state.voiceMemos, memo] }));
    return memo;
  },

  deleteVoiceMemo: async (id) => {
    await db.delete('voiceMemos', id);
    set((state) => ({
      voiceMemos: state.voiceMemos.filter((v) => v.id !== id),
    }));
  },

  // Settings actions
  updateSettings: async (updates) => {
    const current = get().settings;
    if (!current) return;

    const updated: AppSettings = {
      branding: { ...current.branding, ...updates.branding },
      privacy: { ...current.privacy, ...updates.privacy },
    };

    await db.putSetting('appSettings', updated);
    set({ settings: updated });
  },
}));
