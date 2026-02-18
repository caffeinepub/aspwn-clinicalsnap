// Schema versioning and migrations

import { db } from './indexedDb';
import { DEFAULT_TREATMENT_TYPES } from '../models';
import type { TreatmentType, AppSettings } from '../models';

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
  }
}
