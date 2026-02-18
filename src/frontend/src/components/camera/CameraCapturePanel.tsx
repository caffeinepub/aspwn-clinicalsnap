// Full-screen camera capture interface with iPad-hardened initialization, explicit video playback trigger, robust error recovery, toggle-based camera options UI with alignment guides, ghost overlay, view template selection persisted to captured photos, and fallback system camera capture button with structured diagnostics.

import { useEffect, useState, useRef } from 'react';
import { useCamera } from '@/camera/useCamera';
import { useAppStore } from '@/lib/state/useAppStore';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, X, Circle, AlertCircle } from 'lucide-react';
import { captureFileToPhoto } from '@/lib/media/photoStorage';
import { toast } from 'sonner';
import { CameraFlipToggle } from './CameraFlipToggle';
import { CameraAlignmentGuidesOverlay } from './CameraAlignmentGuidesOverlay';
import { GhostOverlayPickerDialog } from './GhostOverlayPickerDialog';
import { CameraOptionsToggles } from './CameraOptionsToggles';
import { FallbackCameraCaptureButton } from './FallbackCameraCaptureButton';
import { validateVideoPreview } from '@/lib/media/cameraPreviewValidation';
import { logCameraDiagnostic, categorizeCameraError } from '@/lib/media/cameraDiagnostics';

interface CameraCapturePanelProps {
  sessionId: string;
  patientId: string;
  onClose: () => void;
}

interface ConstraintConfig {
  facingMode: 'user' | 'environment';
  width?: number;
  height?: number;
  quality: number;
}

export function CameraCapturePanel({ sessionId, patientId, onClose }: CameraCapturePanelProps) {
  const { createPhoto, photos } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasAttemptedStart, setHasAttemptedStart] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [isValidatingPreview, setIsValidatingPreview] = useState(false);
  const [previewValidationFailed, setPreviewValidationFailed] = useState(false);
  const [constraintAttempt, setConstraintAttempt] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isFallbackProcessing, setIsFallbackProcessing] = useState(false);
  const validationTimeoutRef = useRef<number | null>(null);

  // Alignment guides state
  const [guidesEnabled, setGuidesEnabled] = useState(false);

  // Ghost overlay state
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [ghostPhotoId, setGhostPhotoId] = useState<string | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(50);
  const [showGhostPicker, setShowGhostPicker] = useState(false);

  // View template state
  const [selectedViewTemplate, setSelectedViewTemplate] = useState<string>('');

  // Check if patient/session are valid
  const hasValidContext = Boolean(patientId && sessionId);

  // Constraint fallback configurations for iPad compatibility
  const constraintConfigs: ConstraintConfig[] = [
    // Attempt 1: High quality (desktop/modern devices)
    { facingMode: 'environment', width: 1920, height: 1080, quality: 0.9 },
    // Attempt 2: Medium quality (iPad fallback)
    { facingMode: 'environment', width: 1280, height: 720, quality: 0.85 },
    // Attempt 3: iOS-safe resolution (640 is well-supported on iOS)
    { facingMode: 'environment', width: 640, height: 480, quality: 0.85 },
    // Attempt 4: Minimal constraints (last resort)
    { facingMode: 'environment', quality: 0.8 },
  ];

  const currentConfig = constraintConfigs[Math.min(constraintAttempt, constraintConfigs.length - 1)];

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
    facingMode: currentConfig.facingMode,
    width: currentConfig.width,
    height: currentConfig.height,
    quality: currentConfig.quality,
  });

  // Get session photos for ghost overlay
  const sessionPhotos = photos.filter((p) => p.sessionId === sessionId);

  // Get ghost photo data and validate it still exists
  const ghostPhoto = ghostPhotoId ? sessionPhotos.find((p) => p.id === ghostPhotoId) : null;
  const ghostImageUrl = ghostPhoto ? uint8ArrayToObjectURL(ghostPhoto.imageData) : null;

  // Check if ghost photo was deleted
  useEffect(() => {
    if (ghostPhotoId && !ghostPhoto) {
      // Ghost photo was deleted
      setGhostPhotoId(null);
      setGhostEnabled(false);
      toast.error('Reference photo was deleted. Ghost overlay has been disabled.');
      
      logCameraDiagnostic({
        category: 'unknown',
        operation: 'capture',
        message: 'Ghost reference photo no longer exists',
      });
    }
  }, [ghostPhotoId, ghostPhoto]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (validationTimeoutRef.current !== null) {
        clearTimeout(validationTimeoutRef.current);
      }
      // Cleanup ghost image URL
      if (ghostImageUrl) {
        URL.revokeObjectURL(ghostImageUrl);
      }
    };
  }, [stopCamera, ghostImageUrl]);

  // Explicitly trigger video playback after camera becomes active (iPad Safari fix)
  useEffect(() => {
    if (isActive && videoRef.current && hasAttemptedStart) {
      const video = videoRef.current;
      
      // Ensure video attributes are set for iPad Safari
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      
      // Explicitly call play() to trigger playback on iPad Safari
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            logCameraDiagnostic({
              category: 'unknown',
              operation: 'start',
              message: 'Video playback started successfully',
            });
          })
          .catch((err) => {
            logCameraDiagnostic({
              category: 'unknown',
              operation: 'start',
              message: 'Video play() failed',
              details: { error: String(err) },
            });
            
            // Try again after a short delay
            setTimeout(() => {
              video.play().catch((retryErr) => {
                console.error('Video play retry failed:', retryErr);
              });
            }, 500);
          });
      }
    }
  }, [isActive, hasAttemptedStart, videoRef]);

  // Validate preview when camera becomes active
  useEffect(() => {
    if (isActive && videoRef.current && hasAttemptedStart && !isValidatingPreview) {
      setIsValidatingPreview(true);
      setPreviewValidationFailed(false);

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'validation',
        message: 'Starting preview validation',
        details: { attempt: constraintAttempt + 1 },
      });

      validateVideoPreview(videoRef.current, 8000)
        .then((result) => {
          setIsValidatingPreview(false);

          if (!result.isReady) {
            logCameraDiagnostic({
              category: 'unknown',
              operation: 'validation',
              message: `Preview validation failed: ${result.reason}`,
              details: {
                attempt: constraintAttempt + 1,
                readyState: videoRef.current?.readyState,
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight,
              },
            });

            setPreviewValidationFailed(true);

            // Try fallback constraint if available
            if (constraintAttempt < constraintConfigs.length - 1) {
              validationTimeoutRef.current = window.setTimeout(() => {
                handleConstraintFallback();
              }, 1000);
            }
          } else {
            logCameraDiagnostic({
              category: 'unknown',
              operation: 'validation',
              message: 'Preview validation successful',
              details: {
                attempt: constraintAttempt + 1,
                readyState: videoRef.current?.readyState,
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight,
              },
            });
          }
        })
        .catch((err) => {
          console.error('Preview validation error:', err);
          setIsValidatingPreview(false);
          setPreviewValidationFailed(true);

          logCameraDiagnostic({
            category: 'unknown',
            operation: 'validation',
            message: 'Preview validation exception',
            details: { error: String(err) },
          });
        });
    }
  }, [isActive, hasAttemptedStart, constraintAttempt]);

  // Watchdog: if loading for more than 12 seconds, treat as timeout
  useEffect(() => {
    if (isLoading && hasAttemptedStart) {
      const timeout = setTimeout(() => {
        if (isLoading && !isActive && !error) {
          logCameraDiagnostic({
            category: 'timeout',
            operation: 'start',
            message: 'Camera start timeout (12s)',
            details: { attempt: constraintAttempt + 1 },
          });

          // Try fallback or retry
          if (constraintAttempt < constraintConfigs.length - 1) {
            handleConstraintFallback();
          } else {
            retry();
          }
        }
      }, 12000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, hasAttemptedStart, isActive, error, retry, constraintAttempt]);

  const handleConstraintFallback = async () => {
    const nextAttempt = constraintAttempt + 1;
    if (nextAttempt >= constraintConfigs.length) {
      return;
    }

    logCameraDiagnostic({
      category: 'constraint',
      operation: 'start',
      message: `Trying fallback constraint configuration ${nextAttempt + 1}`,
      details: { config: constraintConfigs[nextAttempt] },
    });

    await stopCamera();
    setConstraintAttempt(nextAttempt);
    setPreviewValidationFailed(false);

    // Small delay before retry
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const handleStartCamera = async () => {
    if (!hasValidContext) {
      logCameraDiagnostic({
        category: 'unknown',
        operation: 'start',
        message: 'Camera start blocked: missing patient or session',
      });
      return;
    }

    setHasAttemptedStart(true);
    setPreviewValidationFailed(false);
    setCaptureError(null);

    logCameraDiagnostic({
      category: 'unknown',
      operation: 'start',
      message: 'User initiated camera start',
      details: { attempt: constraintAttempt + 1, config: currentConfig },
    });

    const success = await startCamera();

    if (!success) {
      const category = error ? categorizeCameraError(error) : 'unknown';
      logCameraDiagnostic({
        category,
        operation: 'start',
        message: 'Camera start failed',
        details: {
          attempt: constraintAttempt + 1,
          errorType: error?.type,
          errorMessage: error?.message,
        },
      });

      // Try fallback constraint if this was a constraint error
      if (category === 'constraint' && constraintAttempt < constraintConfigs.length - 1) {
        toast.info('Trying alternative camera settings...');
        handleConstraintFallback();
      } else {
        toast.error('Failed to start camera');
      }
    }
  };

  const handleRetry = async () => {
    setSwitchError(null);
    setPreviewValidationFailed(false);
    setCaptureError(null);

    logCameraDiagnostic({
      category: 'unknown',
      operation: 'start',
      message: 'User initiated retry',
      details: { attempt: constraintAttempt + 1 },
    });

    const success = await retry();

    if (!success) {
      logCameraDiagnostic({
        category: error ? categorizeCameraError(error) : 'unknown',
        operation: 'start',
        message: 'Retry failed',
        details: { errorType: error?.type, errorMessage: error?.message },
      });

      toast.error('Failed to start camera');
    }
  };

  const handleSwitchCamera = async () => {
    setSwitchError(null);
    setIsSwitching(true);

    logCameraDiagnostic({
      category: 'unknown',
      operation: 'switch',
      message: 'User initiated camera switch',
      details: { currentFacingMode },
    });

    try {
      const success = await switchCamera();
      if (!success) {
        const errorMsg = 'Unable to switch cameras. Your device may only have one camera.';
        setSwitchError(errorMsg);

        logCameraDiagnostic({
          category: 'not-found',
          operation: 'switch',
          message: 'Camera switch failed',
        });

        toast.error('Failed to switch camera');
      } else {
        logCameraDiagnostic({
          category: 'unknown',
          operation: 'switch',
          message: 'Camera switch successful',
          details: { newFacingMode: currentFacingMode },
        });

        toast.success(`Switched to ${currentFacingMode === 'user' ? 'front' : 'back'} camera`);
      }
    } catch (err) {
      console.error('Switch camera error:', err);
      setSwitchError('Camera switching is not supported on this device.');

      logCameraDiagnostic({
        category: 'not-supported',
        operation: 'switch',
        message: 'Camera switch exception',
        details: { error: String(err) },
      });

      toast.error('Camera switching not supported');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCapture = async () => {
    if (!hasValidContext) {
      const errorMsg = 'Cannot capture: patient or session not selected';
      setCaptureError(errorMsg);
      toast.error(errorMsg);

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'capture',
        message: 'Capture blocked: missing patient or session',
      });
      return;
    }

    setIsCapturing(true);
    setCaptureError(null);

    logCameraDiagnostic({
      category: 'unknown',
      operation: 'capture',
      message: 'User initiated photo capture',
    });

    try {
      const file = await capturePhoto();
      if (!file) {
        const errorMsg = 'Failed to capture photo. Please try again.';
        setCaptureError(errorMsg);
        toast.error(errorMsg);

        logCameraDiagnostic({
          category: 'unknown',
          operation: 'capture',
          message: 'Capture returned null file',
        });

        setIsCapturing(false);
        return;
      }

      const photoData = await captureFileToPhoto(file, sessionId, patientId);
      await createPhoto({
        ...photoData,
        sessionId,
        patientId,
        capturedAt: photoData.timestamp,
        viewTemplate: selectedViewTemplate || undefined,
      });

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'capture',
        message: 'Photo captured and saved successfully',
        details: { hasViewTemplate: Boolean(selectedViewTemplate) },
      });

      toast.success('Photo captured successfully');
    } catch (err) {
      console.error('Capture error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to capture photo';
      setCaptureError(errorMsg);
      toast.error(errorMsg);

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'capture',
        message: 'Capture exception',
        details: { error: String(err) },
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFallbackCapture = async (file: File) => {
    if (!hasValidContext) {
      const errorMsg = 'Cannot capture: patient or session not selected';
      toast.error(errorMsg);

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'fallback-capture',
        message: 'Fallback capture blocked: missing patient or session',
      });
      return;
    }

    setIsFallbackProcessing(true);
    setCaptureError(null);

    logCameraDiagnostic({
      category: 'unknown',
      operation: 'fallback-capture',
      message: 'Processing fallback capture',
      details: { fileType: file.type, fileSize: file.size },
    });

    try {
      const photoData = await captureFileToPhoto(file, sessionId, patientId);
      await createPhoto({
        ...photoData,
        sessionId,
        patientId,
        capturedAt: photoData.timestamp,
        viewTemplate: selectedViewTemplate || undefined,
      });

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'fallback-capture',
        message: 'Fallback photo saved successfully',
        details: { hasViewTemplate: Boolean(selectedViewTemplate) },
      });

      toast.success('Photo captured successfully');
    } catch (err) {
      console.error('Fallback capture error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to capture photo';
      setCaptureError(errorMsg);
      toast.error(errorMsg);

      logCameraDiagnostic({
        category: 'unknown',
        operation: 'fallback-capture',
        message: 'Fallback capture exception',
        details: { error: String(err) },
      });
    } finally {
      setIsFallbackProcessing(false);
    }
  };

  const handleFallbackCancel = () => {
    logCameraDiagnostic({
      category: 'unknown',
      operation: 'fallback-capture',
      message: 'User canceled fallback capture',
    });
  };

  const handleFallbackError = (error: string) => {
    setCaptureError(error);
    toast.error(error);

    logCameraDiagnostic({
      category: 'unknown',
      operation: 'fallback-capture',
      message: 'Fallback capture error',
      details: { error },
    });
  };

  const handleGhostPhotoSelect = (photoId: string | null) => {
    setGhostPhotoId(photoId);
    if (photoId) {
      setGhostEnabled(true);
      logCameraDiagnostic({
        category: 'unknown',
        operation: 'capture',
        message: 'Ghost overlay photo selected',
      });
    } else {
      setGhostEnabled(false);
    }
    setShowGhostPicker(false);
  };

  // Render camera not supported
  if (isSupported === false) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Not Supported</AlertTitle>
          <AlertDescription>
            Your device or browser does not support camera access. Please try using a different device or browser.
          </AlertDescription>
        </Alert>
        <Button onClick={onClose} variant="outline" className="mt-4 touch-target">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 relative z-10">
        <h2 className="text-white text-lg font-semibold">Camera</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 touch-target"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera preview container */}
      <div className="flex-1 relative overflow-hidden camera-preview-container">
        {!isActive && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={handleStartCamera}
              disabled={!hasValidContext || isLoading}
              size="lg"
              className="touch-target"
            >
              <Camera className="w-5 h-5 mr-2" />
              {hasValidContext ? 'Start Camera' : 'Select Patient & Session'}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error.message}</p>
                {error.type === 'permission' && (
                  <p className="text-sm">
                    Please grant camera permission in your browser settings and try again.
                  </p>
                )}
                {error.type === 'not-found' && (
                  <p className="text-sm">
                    Make sure your device has a camera and it's not being used by another application.
                  </p>
                )}
              </AlertDescription>
            </Alert>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <Button onClick={handleRetry} variant="outline" className="touch-target">
                Retry
              </Button>
              <Button onClick={onClose} variant="outline" className="touch-target">
                Close
              </Button>
            </div>
          </div>
        )}

        {previewValidationFailed && isActive && (
          <div className="absolute top-20 left-0 right-0 flex justify-center px-4 z-10">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera Preview Issue</AlertTitle>
              <AlertDescription>
                The camera preview appears to be blank or frozen. Trying alternative settings...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {switchError && (
          <div className="absolute top-20 left-0 right-0 flex justify-center px-4 z-10">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{switchError}</AlertDescription>
            </Alert>
          </div>
        )}

        {captureError && (
          <div className="absolute top-20 left-0 right-0 flex justify-center px-4 z-10">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{captureError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Video preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Ghost overlay */}
        {isActive && ghostEnabled && ghostImageUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: ghostOpacity / 100 }}
          >
            <img
              src={ghostImageUrl}
              alt="Reference"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Alignment guides overlay */}
        {isActive && guidesEnabled && <CameraAlignmentGuidesOverlay />}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera options */}
      {isActive && !isLoading && (
        <div className="bg-black/50 p-4 space-y-3 relative z-10">
          <CameraOptionsToggles
            guidesEnabled={guidesEnabled}
            onGuidesChange={setGuidesEnabled}
            ghostEnabled={ghostEnabled}
            onGhostEnabledChange={setGhostEnabled}
            ghostOpacity={ghostOpacity}
            onGhostOpacityChange={setGhostOpacity}
            onSelectGhostPhoto={() => setShowGhostPicker(true)}
            hasGhostPhoto={Boolean(ghostPhotoId)}
            hasSessionPhotos={sessionPhotos.length > 0}
            selectedViewTemplate={selectedViewTemplate}
            onViewTemplateChange={setSelectedViewTemplate}
          />
        </div>
      )}

      {/* Controls */}
      <div className="bg-black/50 p-6 flex items-center justify-center gap-4 relative z-10">
        {isActive && !isLoading && (
          <>
            <CameraFlipToggle
              currentFacingMode={currentFacingMode}
              onToggle={handleSwitchCamera}
              disabled={isSwitching || isCapturing}
              isLoading={isSwitching}
            />

            <Button
              onClick={handleCapture}
              disabled={isCapturing || isSwitching || !hasValidContext}
              size="lg"
              className="w-16 h-16 rounded-full p-0 touch-target"
              variant="outline"
            >
              {isCapturing ? (
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Circle className="w-12 h-12" />
              )}
            </Button>

            <div className="w-16" />
          </>
        )}

        {!isActive && !isLoading && !error && (
          <FallbackCameraCaptureButton
            onCapture={handleFallbackCapture}
            onCancel={handleFallbackCancel}
            onError={handleFallbackError}
            disabled={!hasValidContext || isFallbackProcessing}
            isProcessing={isFallbackProcessing}
          />
        )}
      </div>

      {/* Ghost photo picker dialog */}
      <GhostOverlayPickerDialog
        open={showGhostPicker}
        onOpenChange={setShowGhostPicker}
        sessionPhotos={sessionPhotos}
        selectedPhotoId={ghostPhotoId}
        onSelectPhoto={handleGhostPhotoSelect}
      />
    </div>
  );
}
