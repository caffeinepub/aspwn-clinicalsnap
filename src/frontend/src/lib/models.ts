// Domain models for ClinicalSnap

export interface Patient {
  id: string;
  name: string;
  patientId: string;
  dateOfBirth: string;
  treatmentHistory: string;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  patientId: string;
  title: string;
  date: string; // ISO date string
  treatmentTypeId?: string;
  voiceMemoId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Photo {
  id: string;
  sessionId: string;
  patientId: string;
  imageData: Uint8Array; // Full resolution
  thumbnailData: Uint8Array; // Thumbnail for grid
  capturedAt: number;
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  photoId: string;
  type: 'pen' | 'highlight' | 'text';
  data: AnnotationData;
  createdAt: number;
  updatedAt: number;
}

export type AnnotationData = PenAnnotation | HighlightAnnotation | TextAnnotation;

export interface PenAnnotation {
  type: 'pen';
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

export interface HighlightAnnotation {
  type: 'highlight';
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

export interface TextAnnotation {
  type: 'text';
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface BeforeAfterPairing {
  id: string;
  sessionId: string;
  patientId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  createdAt: number;
}

export interface TreatmentType {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface VoiceMemo {
  id: string;
  sessionId: string;
  audioData: Uint8Array;
  duration: number; // seconds
  createdAt: number;
}

export interface BrandingSettings {
  clinicName: string;
  logoData?: Uint8Array;
  useDefaultLogo: boolean;
}

export interface PrivacySettings {
  pinEnabled: boolean;
  pinHash?: string;
  autoLockTimeout: number; // minutes, 0 = never
}

export interface AppSettings {
  branding: BrandingSettings;
  privacy: PrivacySettings;
}

// Default treatment types
export const DEFAULT_TREATMENT_TYPES: Omit<TreatmentType, 'id' | 'createdAt'>[] = [
  { name: 'Veneer', color: '#0ea5e9' },
  { name: 'Smile Design', color: '#8b5cf6' },
  { name: 'Orthodontics', color: '#ec4899' },
  { name: 'Aligners', color: '#10b981' },
  { name: 'Implants', color: '#f59e0b' },
  { name: 'Whitening', color: '#06b6d4' },
  { name: 'Crown', color: '#6366f1' },
  { name: 'Bridge', color: '#14b8a6' },
];
