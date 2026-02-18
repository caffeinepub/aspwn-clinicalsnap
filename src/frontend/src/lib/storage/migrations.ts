// Schema versioning and migrations with voice memo MIME type backfill

import { db } from './indexedDb';
import { DEFAULT_TREATMENT_TYPES } from '../models';
import { detectAudioMimeType } from '../media/audioMemo';
import type { TreatmentType, AppSettings, Session, VoiceMemo } from '../models';

export async function runMigrations(): Promise<void> {
  await db.init();

  // Check if this is first run
  const hasData = await db.getSetting('initialized');
  
  if (!hasData) {
    // Initialize default treatment types
    const now = Date.now();
    for (const tt of DEFAULT_TREATMENT_TYPES) {
      const treatmentType: TreatmentType = {
        id: crypto.randomUUID(),
        ...tt,
        createdAt: now,
      };
      await db.put('treatmentTypes', treatmentType);
    }

    // Initialize default settings
    const defaultSettings: AppSettings = {
      branding: {
        clinicName: 'Aspen Clinic Snap',
        useDefaultLogo: true,
      },
      privacy: {
        pinEnabled: false,
        autoLockTimeout: 5, // 5 minutes default
      },
    };
    await db.putSetting('appSettings', defaultSettings);
    await db.putSetting('initialized', true);
  } else {
    // For existing installs, add missing default treatment types
    const existingTypes = await db.getAll('treatmentTypes');
    const existingNames = new Set(existingTypes.map((t: TreatmentType) => t.name));
    
    const now = Date.now();
    for (const tt of DEFAULT_TREATMENT_TYPES) {
      if (!existingNames.has(tt.name)) {
        const treatmentType: TreatmentType = {
          id: crypto.randomUUID(),
          ...tt,
          createdAt: now,
        };
        await db.put('treatmentTypes', treatmentType);
      }
    }
  }

  // Migrate sessions to multi-treatment format (idempotent)
  await migrateSessionsToMultiTreatment();

  // Migrate voice memos to include MIME type (idempotent)
  await migrateVoiceMemosToIncludeMimeType();
}

async function migrateSessionsToMultiTreatment(): Promise<void> {
  const sessions = await db.getAll('sessions');
  
  for (const session of sessions) {
    let needsUpdate = false;
    const updated = { ...session };

    // If treatmentTypeIds doesn't exist or is empty, but treatmentTypeId exists
    if ((!updated.treatmentTypeIds || updated.treatmentTypeIds.length === 0) && updated.treatmentTypeId) {
      updated.treatmentTypeIds = [updated.treatmentTypeId];
      needsUpdate = true;
    }
    // If neither exists, ensure treatmentTypeIds is an empty array
    else if (!updated.treatmentTypeIds) {
      updated.treatmentTypeIds = [];
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db.put('sessions', updated as Session);
    }
  }
}

async function migrateVoiceMemosToIncludeMimeType(): Promise<void> {
  const voiceMemos = await db.getAll('voiceMemos');
  
  for (const memo of voiceMemos) {
    // If mimeType doesn't exist, detect it from audio data or use default
    if (!memo.mimeType) {
      const updated = { ...memo };
      
      // Try to detect MIME type from audio data
      if (memo.audioData && memo.audioData.length > 0) {
        updated.mimeType = detectAudioMimeType(new Uint8Array(memo.audioData));
      } else {
        // Fallback to audio/mpeg for legacy recordings
        updated.mimeType = 'audio/mpeg';
      }
      
      await db.put('voiceMemos', updated as VoiceMemo);
    }
  }
}
