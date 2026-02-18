// Session timeline with scrollable session list, photos grouped by session, camera capture, photo import, voice memo, and before/after comparison actions

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Mic, ArrowLeftRight, Plus } from 'lucide-react';
import { PhotoThumbnailGrid } from '../photos/PhotoThumbnailGrid';
import { SessionEditorDialog } from '../sessions/SessionEditorDialog';
import { SessionDeleteConfirmDialog } from '../sessions/SessionDeleteConfirmDialog';
import { SessionPhotoImportButton } from '../photos/SessionPhotoImportButton';
import { getSessionTreatmentIds } from '@/lib/models';

interface SessionTimelinePanelProps {
  patientId: string;
  onOpenCamera: (sessionId: string) => void;
  onOpenVoiceMemo: (sessionId: string) => void;
  onOpenPhotoViewer: (photoId: string) => void;
  onOpenBeforeAfter: (sessionId: string) => void;
}

export function SessionTimelinePanel({
  patientId,
  onOpenCamera,
  onOpenVoiceMemo,
  onOpenPhotoViewer,
  onOpenBeforeAfter,
}: SessionTimelinePanelProps) {
  const { sessions, photos, treatmentTypes, selectedPatientId, deleteSession } = useAppStore();
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Use selectedPatientId from store if patientId prop is not provided
  const activePatientId = patientId || selectedPatientId;

  // Filter sessions for this patient
  const patientSessions = sessions
    .filter((s) => s.patientId === activePatientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTreatmentTypeNames = (session: typeof sessions[0]) => {
    const treatmentIds = getSessionTreatmentIds(session);
    return treatmentIds
      .map((id) => treatmentTypes.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    setDeletingSessionId(null);
  };

  if (!activePatientId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p>Select a patient to view sessions</p>
        </div>
      </div>
    );
  }

  const editingSession = editingSessionId ? sessions.find((s) => s.id === editingSessionId) : undefined;
  const deletingSession = deletingSessionId ? sessions.find((s) => s.id === deletingSessionId) : undefined;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header - fixed */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Sessions</h2>
            {patientSessions.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {patientSessions.length} {patientSessions.length === 1 ? 'session' : 'sessions'}
              </p>
            )}
          </div>
          <Button onClick={() => setShowNewSessionDialog(true)} className="touch-target">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Sessions list - scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {patientSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No sessions yet. Create a session to start capturing photos.</p>
              </div>
            ) : (
              patientSessions.map((session) => {
                const sessionPhotos = photos.filter((p) => p.sessionId === session.id);
                const treatmentNames = getTreatmentTypeNames(session);

                return (
                  <div key={session.id} className="space-y-4">
                    {/* Session header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{session.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{formatDate(session.date)}</span>
                          {treatmentNames && (
                            <>
                              <span>•</span>
                              <span className="truncate">{treatmentNames}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSessionId(session.id)}
                          className="touch-target"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingSessionId(session.id)}
                          className="touch-target"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenCamera(session.id)}
                        className="touch-target"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>

                      <SessionPhotoImportButton
                        sessionId={session.id}
                        patientId={activePatientId}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenVoiceMemo(session.id)}
                        className="touch-target"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Voice Memo
                      </Button>

                      {sessionPhotos.length >= 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenBeforeAfter(session.id)}
                          className="touch-target"
                        >
                          <ArrowLeftRight className="w-4 h-4 mr-2" />
                          Compare
                        </Button>
                      )}
                    </div>

                    {/* Photos grid */}
                    {sessionPhotos.length > 0 ? (
                      <PhotoThumbnailGrid
                        sessionId={session.id}
                        onSelect={() => {}}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No photos in this session yet</p>
                        <p className="text-sm mt-1">Use Capture or Import to add photos</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* New session dialog */}
      <SessionEditorDialog
        open={showNewSessionDialog}
        onOpenChange={(open) => !open && setShowNewSessionDialog(false)}
        patientId={activePatientId}
      />

      {/* Edit session dialog */}
      {editingSession && (
        <SessionEditorDialog
          open={true}
          onOpenChange={(open) => !open && setEditingSessionId(null)}
          patientId={activePatientId}
          session={editingSession}
        />
      )}

      {/* Delete session dialog */}
      {deletingSession && (
        <SessionDeleteConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setDeletingSessionId(null)}
          sessionTitle={deletingSession.title}
          onConfirm={() => handleDeleteSession(deletingSession.id)}
        />
      )}
    </div>
  );
}
