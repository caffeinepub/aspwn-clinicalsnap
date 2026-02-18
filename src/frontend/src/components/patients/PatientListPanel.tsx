// Patient list panel with always-visible scrollbar, search by name/ID/treatment type, CRUD operations including edit and delete actions with touch-friendly controls for iPad Safari

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Pencil, Trash2 } from 'lucide-react';
import { PatientEditorDialog } from './PatientEditorDialog';
import { PatientDeleteConfirmDialog } from './PatientDeleteConfirmDialog';
import { filterPatients } from '@/lib/search/filtering';
import type { SearchFilters } from '@/lib/search/filtering';
import type { Patient } from '@/lib/models';

export function PatientListPanel() {
  const {
    patients,
    sessions,
    treatmentTypes,
    selectedPatientId,
    selectPatient,
    deletePatient,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filters: SearchFilters = {
    query: searchQuery,
    treatmentTypeIds: [],
    dateFrom: null,
    dateTo: null,
  };

  const filteredPatients = filterPatients(patients, sessions, filters, treatmentTypes);

  // Sort by most recent update
  const sortedPatients = [...filteredPatients].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDelete = async () => {
    if (!deletingPatient) return;
    
    setIsDeleting(true);
    try {
      await deletePatient(deletingPatient.id);
      setDeletingPatient(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent patient selection
    setEditingPatient(patient);
  };

  const handleDeleteClick = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent patient selection
    setDeletingPatient(patient);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header - fixed at top */}
      <div className="p-4 border-b space-y-3 flex-shrink-0">
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
            placeholder="Search by name or treatment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 touch-target"
          />
        </div>
      </div>

      {/* Patient list - scrollable with always-visible scrollbar */}
      <div 
        className="flex-1 min-h-0 overflow-y-scroll patient-list-scroll"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
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
                <div
                  key={patient.id}
                  className={`relative rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <button
                    onClick={() => selectPatient(patient.id)}
                    className="w-full text-left p-3 pr-24 touch-target"
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

                  {/* Action buttons - positioned absolutely on the right */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      size="icon"
                      variant={isSelected ? 'secondary' : 'ghost'}
                      onClick={(e) => handleEdit(patient, e)}
                      className="touch-target h-11 w-11"
                      title="Edit patient"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={isSelected ? 'secondary' : 'ghost'}
                      onClick={(e) => handleDeleteClick(patient, e)}
                      className="touch-target h-11 w-11 text-destructive hover:text-destructive"
                      title="Delete patient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create dialog */}
      <PatientEditorDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        onSave={() => setIsCreating(false)}
      />

      {/* Edit dialog */}
      <PatientEditorDialog
        open={!!editingPatient}
        onOpenChange={(open) => !open && setEditingPatient(null)}
        patient={editingPatient || undefined}
        onSave={() => setEditingPatient(null)}
      />

      {/* Delete confirmation dialog */}
      <PatientDeleteConfirmDialog
        open={!!deletingPatient}
        onOpenChange={(open) => !open && setDeletingPatient(null)}
        patientName={deletingPatient?.name || ''}
        onConfirm={handleDelete}
      />
    </div>
  );
}
