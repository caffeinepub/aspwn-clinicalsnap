// Full-screen camera capture interface with alignment guides, ghost overlay, view templates, and robust permission handling

import { useEffect, useState } from 'react';
import { useCamera } from '@/camera/useCamera';
import { useAppStore } from '@/lib/state/useAppStore';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, Circle, AlertCircle, Grid3x3, Ghost, Tag } from 'lucide-react';
import { captureFileToPhoto } from '@/lib/media/photoStorage';
import { toast } from 'sonner';
import { CameraFlipToggle } from './CameraFlipToggle';
import { CameraAlignmentGuidesOverlay } from './CameraAlignmentGuidesOverlay';
import { GhostOverlayPickerDialog } from './GhostOverlayPickerDialog';
import { VIEW_TEMPLATES } from '@/lib/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface CameraCapturePanelProps {
  sessionId: string;
  patientId: string;
  onClose: () => void;
}

export function CameraCapturePanel({ sessionId, patientId, onClose }: CameraCapturePanelProps) {
  const { createPhoto, photos } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasAttemptedStart, setHasAttemptedStart] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Alignment guides state
  const [guidesEnabled, setGuidesEnabled] = useState(false);

  // Ghost overlay state
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [ghostPhotoId, setGhostPhotoId] = useState<string | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(50);
  const [showGhostPicker, setShowGhostPicker] = useState(false);

  // View template state
  const [selectedViewTemplate, setSelectedViewTemplate] = useState<string>('');

  const {
    isActive,
    isSupported,
    error,
    isLoading,
    currentFacingMode,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    width: 1920,
    height: 1080,
    quality: 0.9,
  });

  // Get ghost photo data
  const ghostPhoto = ghostPhotoId ? photos.find((p) => p.id === ghostPhotoId) : null;
  const ghostImageUrl = ghostPhoto ? uint8ArrayToObjectURL(ghostPhoto.imageData) : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Watchdog: if loading for more than 10 seconds, treat as timeout
  useEffect(() => {
    if (isLoading && hasAttemptedStart) {
      const timeout = setTimeout(() => {
        if (isLoading && !isActive && !error) {
          retry();
        }
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, hasAttemptedStart, isActive, error, retry]);

  const handleStartCamera = async () => {
    setHasAttemptedStart(true);
    const success = await startCamera();
    if (!success) {
      toast.error('Failed to start camera');
    }
  };

  const handleRetry = async () => {
    setSwitchError(null);
    const success = await retry();
    if (!success) {
      toast.error('Failed to start camera');
    }
  };

  const handleSwitchCamera = async () => {
    setSwitchError(null);
    setIsSwitching(true);
    try {
      const success = await switchCamera();
      if (!success) {
        setSwitchError('Unable to switch cameras. Your device may only have one camera.');
        toast.error('Failed to switch camera');
      } else {
        toast.success(`Switched to ${currentFacingMode === 'user' ? 'back' : 'front'} camera`);
      }
    } catch (err) {
      console.error('Switch camera error:', err);
      setSwitchError('Camera switching is not supported on this device.');
      toast.error('Camera switching not supported');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCapture = async () => {
    if (!patientId || !sessionId) {
      toast.error('Cannot capture: patient or session not selected');
      return;
    }

    setIsCapturing(true);
    try {
      const file = await capturePhoto();
      if (file) {
        const photoData = await captureFileToPhoto(file, sessionId, patientId);
        await createPhoto({
          ...photoData,
          sessionId,
          patientId,
          viewTemplate: selectedViewTemplate || undefined,
        });
        toast.success('Photo captured successfully');
        onClose();
      } else {
        toast.error('Failed to capture photo');
      }
    } catch (err) {
      console.error('Capture failed:', err);
      toast.error('Failed to save photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGhostToggle = () => {
    if (!ghostEnabled && !ghostPhotoId) {
      // Open picker if no photo selected
      setShowGhostPicker(true);
    } else {
      setGhostEnabled(!ghostEnabled);
    }
  };

  const handleGhostPhotoSelect = (photoId: string) => {
    if (photoId) {
      setGhostPhotoId(photoId);
      setGhostEnabled(true);
    } else {
      setGhostPhotoId(null);
      setGhostEnabled(false);
    }
  };

  // Camera not supported
  if (isSupported === false) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Camera Not Supported</h2>
          <p className="text-muted-foreground">
            Your device or browser does not support camera access.
          </p>
          <Button onClick={onClose} className="touch-target">
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Get user-friendly error message
  const getErrorMessage = () => {
    if (!error) return null;

    switch (error.type) {
      case 'permission':
        return {
          title: 'Camera Permission Denied',
          message:
            'Camera access is blocked. Please enable camera permission in your browser settings for this site, then try again. You may need to reload the page after changing permissions.',
        };
      case 'not-found':
        return {
          title: 'No Camera Found',
          message:
            'No camera was detected on your device. Please connect a camera and try again.',
        };
      case 'not-supported':
        return {
          title: 'Camera Not Supported',
          message: 'Your browser does not support camera access.',
        };
      case 'unknown':
      default:
        return {
          title: 'Camera Error',
          message:
            error.message || 'An error occurred while accessing the camera. Please check that no other application is using the camera and try again.',
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera preview */}
      <div className="flex-1 relative min-h-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ minHeight: '300px' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Ghost overlay */}
        {ghostEnabled && ghostImageUrl && isActive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: ghostOpacity / 100 }}
          >
            <img
              src={ghostImageUrl}
              alt="Ghost overlay"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Alignment guides overlay */}
        <CameraAlignmentGuidesOverlay enabled={guidesEnabled && isActive} />

        {/* Error overlay */}
        {errorInfo && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/90">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">{errorInfo.title}</AlertTitle>
              <AlertDescription className="mt-2 space-y-4">
                <p className="text-sm">{errorInfo.message}</p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full touch-target"
                  disabled={isLoading}
                >
                  {isLoading ? 'Starting...' : 'Try Again'}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Switch error notification */}
        {switchError && isActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-md px-4">
            <Alert variant="destructive" className="bg-destructive/90 backdrop-blur">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{switchError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Initial start prompt */}
        {!hasAttemptedStart && !isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/80">
            <div className="text-center space-y-4 max-w-md">
              <Camera className="w-16 h-16 mx-auto text-white" />
              <h2 className="text-xl font-semibold text-white">Ready to Capture</h2>
              <p className="text-white/70">Tap the button below to start the camera</p>
              <Button
                onClick={handleStartCamera}
                size="lg"
                className="touch-target-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Starting Camera...' : 'Start Camera'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && hasAttemptedStart && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-lg">Initializing camera...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/90 p-4 space-y-3">
        {/* Top row: View template and tool toggles */}
        {isActive && (
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            {/* View template selector */}
            <div className="flex items-center gap-2 flex-1">
              <Tag className="w-4 h-4 text-white" />
              <Select value={selectedViewTemplate} onValueChange={setSelectedViewTemplate}>
                <SelectTrigger className="bg-white/10 text-white border-white/20 h-10">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template</SelectItem>
                  {VIEW_TEMPLATES.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guides toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGuidesEnabled(!guidesEnabled)}
              className={`text-white hover:bg-white/20 touch-target ${
                guidesEnabled ? 'bg-white/20' : ''
              }`}
              title="Toggle alignment guides"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>

            {/* Ghost overlay toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGhostToggle}
              className={`text-white hover:bg-white/20 touch-target ${
                ghostEnabled ? 'bg-white/20' : ''
              }`}
              title="Toggle ghost overlay"
            >
              <Ghost className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Ghost opacity slider */}
        {ghostEnabled && ghostPhotoId && isActive && (
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <span className="text-white text-sm whitespace-nowrap">Opacity:</span>
            <Slider
              value={[ghostOpacity]}
              onValueChange={(values) => setGhostOpacity(values[0])}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-white text-sm w-12 text-right">{ghostOpacity}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGhostPicker(true)}
              className="text-white hover:bg-white/20 text-xs"
            >
              Change
            </Button>
          </div>
        )}

        {/* Main capture controls */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="text-white hover:bg-white/10 touch-target-lg"
          >
            <X className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            onClick={handleCapture}
            disabled={!isActive || isCapturing || isLoading || !patientId || !sessionId}
            className="w-20 h-20 rounded-full bg-white hover:bg-white/90 touch-target-lg disabled:opacity-50"
          >
            <Circle className="w-12 h-12 text-black" fill="currentColor" />
          </Button>

          <div className="w-[100px]" />
        </div>

        {/* Camera flip toggle */}
        {isActive && (
          <div className="flex justify-center">
            <CameraFlipToggle
              currentFacingMode={currentFacingMode}
              onToggle={handleSwitchCamera}
              disabled={!isActive || isLoading || isCapturing}
              isLoading={isSwitching}
            />
          </div>
        )}

        {!patientId || !sessionId ? (
          <p className="text-center text-destructive text-sm">
            Cannot capture: patient or session not selected
          </p>
        ) : null}
      </div>

      {/* Ghost overlay picker dialog */}
      <GhostOverlayPickerDialog
        open={showGhostPicker}
        onClose={() => setShowGhostPicker(false)}
        sessionId={sessionId}
        selectedPhotoId={ghostPhotoId}
        onSelectPhoto={handleGhostPhotoSelect}
      />
    </div>
  );
}
