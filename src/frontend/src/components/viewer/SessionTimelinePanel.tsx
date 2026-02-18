// Session timeline with photos grouped by session, camera capture, photo import, before/after comparison

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { getSessionTreatmentIds } from '@/lib/models';
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
    selectedPatientId,
    selectedSessionId,
    selectSession,
    deleteSession,
    deletePatient,
  } = useAppStore();

  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | undefined>(undefined);
  const [showSessionDelete, setShowSessionDelete] = useState(false);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);
  const [showPatientEditor, setShowPatientEditor] = useState(false);
  const [showPatientDelete, setShowPatientDelete] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const patientSessions = sessions
    .filter((s) => s.patientId === selectedPatientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateSession = () => {
    setEditingSession(undefined);
    setShowSessionEditor(true);
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setShowSessionEditor(true);
  };

  const handleDeleteSession = (session: Session) => {
    setDeletingSession(session);
    setShowSessionDelete(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (deletingSession) {
      await deleteSession(deletingSession.id);
      setShowSessionDelete(false);
      setDeletingSession(null);
    }
  };

  const handleConfirmDeletePatient = async () => {
    if (selectedPatient) {
      await deletePatient(selectedPatient.id);
      setShowPatientDelete(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Select a patient to view sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Patient header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{selectedPatient.name}</h2>
            <p className="text-sm text-muted-foreground">ID: {selectedPatient.patientId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPatientEditor(true)}
              className="touch-target"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPatientDelete(true)}
              className="text-destructive hover:text-destructive touch-target"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {patientSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sessions yet</p>
            </div>
          ) : (
            patientSessions.map((session) => {
              const sessionPhotos = photos.filter((p) => p.sessionId === session.id);
              const treatmentIds = getSessionTreatmentIds(session);
              const sessionTreatments = treatmentTypes.filter((t) => treatmentIds.includes(t.id));

              return (
                <div
                  key={session.id}
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    selectedSessionId === session.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Session header */}
                  <div
                    className="p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => selectSession(session.id === selectedSessionId ? null : session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.date), 'MMM d, yyyy')}
                        </p>
                        {sessionTreatments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sessionTreatments.map((treatment) => (
                              <Badge
                                key={treatment.id}
                                variant="secondary"
                                style={{
                                  backgroundColor: `${treatment.color}20`,
                                  color: treatment.color,
                                  borderColor: treatment.color,
                                }}
                                className="text-xs border"
                              >
                                {treatment.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {sessionPhotos.length} photo{sessionPhotos.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Session content (expanded) */}
                  {selectedSessionId === session.id && (
                    <div className="border-t">
                      {/* Action buttons */}
                      <div className="p-3 bg-background border-b flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenCamera(session.id)}
                          className="touch-target"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Capture
                        </Button>
                        <SessionPhotoImportButton
                          sessionId={session.id}
                          patientId={selectedPatient.id}
                          variant="outline"
                          size="sm"
                          className="touch-target"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenVoiceMemo(session.id)}
                          className="touch-target"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Voice
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenCompare(session.id)}
                          className="touch-target"
                          disabled={sessionPhotos.length < 2}
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-2" />
                          Compare
                        </Button>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSession(session)}
                          className="touch-target"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(session)}
                          className="text-destructive hover:text-destructive touch-target"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Photos grid */}
                      <PhotoThumbnailGrid sessionId={session.id} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Create session button */}
      <div className="p-4 border-t">
        <Button onClick={handleCreateSession} className="w-full touch-target">
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Dialogs */}
      <SessionEditorDialog
        open={showSessionEditor}
        onOpenChange={setShowSessionEditor}
        patientId={selectedPatient.id}
        session={editingSession}
      />
      <SessionDeleteConfirmDialog
        open={showSessionDelete}
        onOpenChange={setShowSessionDelete}
        sessionTitle={deletingSession?.title || ''}
        onConfirm={handleConfirmDeleteSession}
      />
      <PatientEditorDialog
        open={showPatientEditor}
        onOpenChange={setShowPatientEditor}
        patient={selectedPatient}
      />
      <PatientDeleteConfirmDialog
        open={showPatientDelete}
        onOpenChange={setShowPatientDelete}
        patientName={selectedPatient.name}
        onConfirm={handleConfirmDeletePatient}
      />
    </div>
  );
}
