// Search and filter utilities with treatment type name search support

import type { Patient, Session, TreatmentType } from '../models';
import { getSessionTreatmentIds } from '../models';

export interface SearchFilters {
  query: string;
  treatmentTypeIds: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export function filterPatients(
  patients: Patient[],
  sessions: Session[],
  filters: SearchFilters,
  treatmentTypes?: TreatmentType[]
): Patient[] {
  return patients.filter((patient) => {
    // Name and treatment type search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const matchesName = patient.name.toLowerCase().includes(query);
      const matchesId = patient.patientId.toLowerCase().includes(query);
      
      // Check if query matches any treatment type in patient's sessions
      let matchesTreatmentType = false;
      if (treatmentTypes && treatmentTypes.length > 0) {
        const patientSessions = sessions.filter((s) => s.patientId === patient.id);
        matchesTreatmentType = patientSessions.some((session) => {
          const sessionTreatmentIds = getSessionTreatmentIds(session);
          return sessionTreatmentIds.some((treatmentId) => {
            const treatment = treatmentTypes.find((t) => t.id === treatmentId);
            return treatment && treatment.name.toLowerCase().includes(query);
          });
        });
      }
      
      if (!matchesName && !matchesId && !matchesTreatmentType) return false;
    }

    // Treatment type filter - check if any session has any of the selected treatment types
    if (filters.treatmentTypeIds.length > 0) {
      const patientSessions = sessions.filter((s) => s.patientId === patient.id);
      const hasMatchingTreatment = patientSessions.some((s) => {
        const sessionTreatmentIds = getSessionTreatmentIds(s);
        return sessionTreatmentIds.some((id) => filters.treatmentTypeIds.includes(id));
      });
      if (!hasMatchingTreatment) return false;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const patientSessions = sessions.filter((s) => s.patientId === patient.id);
      const hasMatchingDate = patientSessions.some((s) => {
        const sessionDate = new Date(s.date);
        if (filters.dateFrom && sessionDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && sessionDate > new Date(filters.dateTo)) return false;
        return true;
      });
      if (!hasMatchingDate) return false;
    }

    return true;
  });
}

export function filterSessions(sessions: Session[], filters: SearchFilters): Session[] {
  return sessions.filter((session) => {
    // Treatment type filter - check if session has any of the selected treatment types
    if (filters.treatmentTypeIds.length > 0) {
      const sessionTreatmentIds = getSessionTreatmentIds(session);
      const hasMatchingTreatment = sessionTreatmentIds.some((id) =>
        filters.treatmentTypeIds.includes(id)
      );
      if (!hasMatchingTreatment) return false;
    }

    // Date range filter
    const sessionDate = new Date(session.date);
    if (filters.dateFrom && sessionDate < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && sessionDate > new Date(filters.dateTo)) return false;

    return true;
  });
}
