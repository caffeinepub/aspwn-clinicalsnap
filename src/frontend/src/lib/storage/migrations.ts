// Schema versioning and migrations

import { db } from './indexedDb';
import { DEFAULT_TREATMENT_TYPES } from '../models';
import type { TreatmentType, AppSettings, Session } from '../models';

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
