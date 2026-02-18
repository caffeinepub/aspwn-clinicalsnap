// Full-screen camera capture interface with robust permission handling and user-initiated start

import { useEffect, useState } from 'react';
import { useCamera } from '@/camera/useCamera';
import { useAppStore } from '@/lib/state/useAppStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, RotateCw, Circle, AlertCircle } from 'lucide-react';
import { captureFileToPhoto } from '@/lib/media/photoStorage';
import { toast } from 'sonner';

interface CameraCapturePanelProps {
  sessionId: string;
  patientId: string;
  onClose: () => void;
}

export function CameraCapturePanel({ sessionId, patientId, onClose }: CameraCapturePanelProps) {
  const { createPhoto } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasAttemptedStart, setHasAttemptedStart] = useState(false);

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
          // Force a retry to break out of stuck loading state
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
    const success = await retry();
    if (!success) {
      toast.error('Failed to start camera');
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

        {/* Initial start prompt (iOS/Safari friendly) */}
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

        {/* Loading overlay (only after user has attempted start) */}
        {isLoading && hasAttemptedStart && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-lg">Initializing camera...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/90 p-6 space-y-4">
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

          <Button
            variant="ghost"
            size="lg"
            onClick={() => switchCamera()}
            disabled={!isActive || isLoading}
            className="text-white hover:bg-white/10 touch-target-lg"
          >
            <RotateCw className="w-6 h-6" />
          </Button>
        </div>

        {isActive && (
          <p className="text-center text-white/70 text-sm">
            {currentFacingMode === 'user' ? 'Front Camera' : 'Back Camera'}
          </p>
        )}

        {!patientId || !sessionId ? (
          <p className="text-center text-destructive text-sm">
            Cannot capture: patient or session not selected
          </p>
        ) : null}
      </div>
    </div>
  );
}
