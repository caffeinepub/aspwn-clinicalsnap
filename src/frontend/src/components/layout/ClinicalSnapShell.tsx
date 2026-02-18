// Main app shell with responsive layout, camera/voice memo overlays, photo viewer, and before/after comparison

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Database } from 'lucide-react';
import { PatientListPanel } from '../patients/PatientListPanel';
import { SessionTimelinePanel } from '../viewer/SessionTimelinePanel';
import { SettingsSheet } from '../settings/SettingsSheet';
import { CameraCapturePanel } from '../camera/CameraCapturePanel';
import { VoiceMemoPanel } from '../voice/VoiceMemoPanel';
import { PhotoViewerOverlay } from '../photos/PhotoViewerOverlay';
import { BeforeAfterCompareDialog } from '../viewer/BeforeAfterCompareDialog';
import { useAppStore } from '@/lib/state/useAppStore';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { toast } from 'sonner';

export function ClinicalSnapShell() {
  const { selectedPatientId, selectedPhotoId } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cameraSessionId, setCameraSessionId] = useState<string | null>(null);
  const [voiceMemoSessionId, setVoiceMemoSessionId] = useState<string | null>(null);
  const [compareSessionId, setCompareSessionId] = useState<string | null>(null);

  const handleOpenCamera = (sessionId: string) => {
    if (!selectedPatientId) {
      toast.error('Please select a patient before capturing photos');
      return;
    }
    if (!sessionId) {
      toast.error('Please select a session before capturing photos');
      return;
    }
    setCameraSessionId(sessionId);
  };

  const handleOpenVoiceMemo = (sessionId: string) => {
    if (!sessionId) {
      toast.error('Please select a session before recording a voice memo');
      return;
    }
    setVoiceMemoSessionId(sessionId);
  };

  const handleOpenCompare = (sessionId: string) => {
    if (!sessionId) {
      toast.error('Please select a session to compare photos');
      return;
    }
    setCompareSessionId(sessionId);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/aspen-clinic-snap-logo.dim_1024x256.png"
              alt="Aspen Clinic Snap"
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs">
              <Database className="w-3 h-3" />
              <span>Local Only</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="touch-target"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Patient list */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <PatientListPanel />
          </ResizablePanel>

          <ResizableHandle />

          {/* Timeline/viewer */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <SessionTimelinePanel
              onOpenCamera={handleOpenCamera}
              onOpenVoiceMemo={handleOpenVoiceMemo}
              onOpenCompare={handleOpenCompare}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Settings */}
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Camera */}
      {cameraSessionId && selectedPatientId && (
        <CameraCapturePanel
          sessionId={cameraSessionId}
          patientId={selectedPatientId}
          onClose={() => setCameraSessionId(null)}
        />
      )}

      {/* Voice memo */}
      {voiceMemoSessionId && (
        <VoiceMemoPanel
          open={!!voiceMemoSessionId}
          onOpenChange={(open) => !open && setVoiceMemoSessionId(null)}
          sessionId={voiceMemoSessionId}
        />
      )}

      {/* Photo viewer */}
      {selectedPhotoId && <PhotoViewerOverlay />}

      {/* Before/After comparison */}
      {compareSessionId && (
        <BeforeAfterCompareDialog
          open={!!compareSessionId}
          onOpenChange={(open) => !open && setCompareSessionId(null)}
          sessionId={compareSessionId}
        />
      )}
    </div>
  );
}
