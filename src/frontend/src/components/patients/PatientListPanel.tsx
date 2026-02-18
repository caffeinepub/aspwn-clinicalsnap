// Patient list panel with search and CRUD

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User } from 'lucide-react';
import { PatientEditorDialog } from './PatientEditorDialog';
import { filterPatients } from '@/lib/search/filtering';
import type { SearchFilters } from '@/lib/search/filtering';

export function PatientListPanel() {
  const {
    patients,
    sessions,
    selectedPatientId,
    selectPatient,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filters: SearchFilters = {
    query: searchQuery,
    treatmentTypeIds: [],
    dateFrom: null,
    dateTo: null,
  };

  const filteredPatients = filterPatients(patients, sessions, filters);

  // Sort by most recent update
  const sortedPatients = [...filteredPatients].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Patients</h2>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="touch-target"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 touch-target"
          />
        </div>
      </div>

      {/* Patient list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No patients found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try a different search</p>
              )}
            </div>
          ) : (
            sortedPatients.map((patient) => {
              const patientSessions = sessions.filter((s) => s.patientId === patient.id);
              const isSelected = selectedPatientId === patient.id;

              return (
                <button
                  key={patient.id}
                  onClick={() => selectPatient(patient.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors touch-target ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="font-medium">{patient.name}</div>
                  <div className={`text-sm mt-1 ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                    ID: {patient.patientId}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={isSelected ? 'secondary' : 'outline'} className="text-xs">
                      {patientSessions.length} {patientSessions.length === 1 ? 'visit' : 'visits'}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Create dialog */}
      <PatientEditorDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        onSave={() => setIsCreating(false)}
      />
    </div>
  );
}
