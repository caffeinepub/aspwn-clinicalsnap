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
  treatmentTypeId?: string; // Legacy single selection (for backward compatibility)
  treatmentTypeIds?: string[]; // New multi-select field
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
  viewTemplate?: string; // Optional view template (e.g., "Frontal", "Left 45°", etc.)
}

export interface Annotation {
  id: string;
  photoId: string;
  type: 'pen' | 'highlight' | 'text' | 'stamp';
  data: AnnotationData;
  createdAt: number;
  updatedAt: number;
}

export type AnnotationData = PenAnnotation | HighlightAnnotation | TextAnnotation | StampAnnotation;

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

export interface StampAnnotation {
  type: 'stamp';
  stampType: 'arrow' | 'margin' | 'prep';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
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
  { name: 'Inlay', color: '#f97316' },
  { name: 'Onlay', color: '#84cc16' },
  { name: 'Veneerlay', color: '#a855f7' },
];

// Default view templates for dental photography
export const VIEW_TEMPLATES = [
  'Frontal',
  'Left 45°',
  'Right 45°',
  'Occlusal',
] as const;

export type ViewTemplate = typeof VIEW_TEMPLATES[number];

// Helper to normalize session treatment IDs (handles legacy single selection)
export function getSessionTreatmentIds(session: Session): string[] {
  if (session.treatmentTypeIds && session.treatmentTypeIds.length > 0) {
    return session.treatmentTypeIds;
  }
  if (session.treatmentTypeId) {
    return [session.treatmentTypeId];
  }
  return [];
}
