// Session timeline with photos grouped by session, camera capture, photo import, and before/after comparison

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Camera, Edit, Trash2, Mic, Calendar, ArrowLeftRight } from 'lucide-react';
import { SessionEditorDialog } from '../sessions/SessionEditorDialog';
import { SessionDeleteConfirmDialog } from '../sessions/SessionDeleteConfirmDialog';
import { PhotoThumbnailGrid } from '../photos/PhotoThumbnailGrid';
import { SessionPhotoImportButton } from '../photos/SessionPhotoImportButton';
import { Badge } from '@/components/ui/badge';
import { PatientEditorDialog } from '../patients/PatientEditorDialog';
import { PatientDeleteConfirmDialog } from '../patients/PatientDeleteConfirmDialog';
import { format } from 'date-fns';
import type { Session } from '@/lib/models';

interface SessionTimelinePanelProps {
  onOpenCamera: (sessionId: string) => void;
  onOpenVoiceMemo: (sessionId: string) => void;
  onOpenCompare: (sessionId: string) => void;
}

export function SessionTimelinePanel({ onOpenCamera, onOpenVoiceMemo, onOpenCompare }: SessionTimelinePanelProps) {
  const {
    patients,
    sessions,
    photos,
    treatmentTypes,
    voiceMemos,
    selectedPatientId,
    selectedSessionId,
    selectSession,
    deleteSession,
    deletePatient,
  } = useAppStore();

  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const patientSessions = sessions
    .filter((s) => s.patientId === selectedPatientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!selectedPatient) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a patient to view their timeline</p>
        </div>
      </div>
    );
  }

  const sessionToEdit = sessions.find((s) => s.id === editingSession);
  const sessionToDelete = sessions.find((s) => s.id === deletingSession);

  const handleSessionCreated = (newSession: Session) => {
    setIsCreatingSession(false);
    // Optionally select the newly created session
    selectSession(newSession.id);
  };

  const handleSessionUpdated = () => {
    setEditingSession(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Patient header */}
      <div className="p-4 border-b bg-card space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{selectedPatient.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {selectedPatient.patientId}
              {selectedPatient.dateOfBirth && ` • DOB: ${format(new Date(selectedPatient.dateOfBirth), 'MMM d, yyyy')}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingPatient(true)}
              className="touch-target"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingPatient(true)}
              className="touch-target text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={() => setIsCreatingSession(true)}
          className="w-full touch-target"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {patientSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sessions yet</p>
              <p className="text-sm mt-1">Create a session to start capturing photos</p>
            </div>
          ) : (
            patientSessions.map((session) => {
              const sessionPhotos = photos.filter((p) => p.sessionId === session.id);
              const treatmentType = treatmentTypes.find((t) => t.id === session.treatmentTypeId);
              const voiceMemo = voiceMemos.find((v) => v.id === session.voiceMemoId);
              const isSelected = selectedSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={`border rounded-lg overflow-hidden ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Session header */}
                  <div className="p-4 bg-muted/30 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{session.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(session.date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenCamera(session.id)}
                          className="touch-target"
                          title="Capture photo"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                        <SessionPhotoImportButton
                          sessionId={session.id}
                          patientId={selectedPatient.id}
                          variant="ghost"
                          size="sm"
                          className="touch-target"
                        />
                        {sessionPhotos.length >= 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenCompare(session.id)}
                            className="touch-target"
                            title="Compare before/after"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenVoiceMemo(session.id)}
                          className="touch-target"
                          title="Voice memo"
                        >
                          <Mic className={`w-4 h-4 ${voiceMemo ? 'text-primary' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSession(session.id)}
                          className="touch-target"
                          title="Edit session"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingSession(session.id)}
                          className="touch-target text-destructive"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {treatmentType && (
                      <Badge style={{ backgroundColor: treatmentType.color }} className="text-white">
                        {treatmentType.name}
                      </Badge>
                    )}
                  </div>

                  {/* Photos */}
                  <PhotoThumbnailGrid
                    sessionId={session.id}
                    onSelect={() => selectSession(session.id)}
                  />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <SessionEditorDialog
        open={isCreatingSession}
        onOpenChange={setIsCreatingSession}
        patientId={selectedPatient.id}
        onSave={handleSessionCreated}
      />

      {sessionToEdit && (
        <SessionEditorDialog
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          patientId={selectedPatient.id}
          session={sessionToEdit}
          onSave={handleSessionUpdated}
        />
      )}

      {sessionToDelete && (
        <SessionDeleteConfirmDialog
          open={!!deletingSession}
          onOpenChange={(open) => !open && setDeletingSession(null)}
          sessionTitle={sessionToDelete.title}
          onConfirm={() => {
            deleteSession(sessionToDelete.id);
            setDeletingSession(null);
          }}
        />
      )}

      <PatientEditorDialog
        open={editingPatient}
        onOpenChange={setEditingPatient}
        patient={selectedPatient}
        onSave={() => setEditingPatient(false)}
      />

      <PatientDeleteConfirmDialog
        open={deletingPatient}
        onOpenChange={setDeletingPatient}
        patientName={selectedPatient.name}
        onConfirm={() => {
          deletePatient(selectedPatient.id);
          setDeletingPatient(false);
        }}
      />
    </div>
  );
}
