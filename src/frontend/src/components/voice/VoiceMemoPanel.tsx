// Voice memo recording and playback panel with MIME-aware audio handling, fallback capture option, and comprehensive error recovery

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mic, Square, Play, Pause, Trash2, Save, X, AlertCircle, RotateCcw } from 'lucide-react';
import { AudioRecorder, type RecordingError } from '@/lib/media/audioMemo';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { FallbackVoiceMemoCaptureButton } from './FallbackVoiceMemoCaptureButton';
import { toast } from 'sonner';

interface VoiceMemoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

interface PendingRecording {
  audioData: Uint8Array;
  duration: number;
  mimeType: string;
}

export function VoiceMemoPanel({ open, onOpenChange, sessionId }: VoiceMemoPanelProps) {
  const { sessions, voiceMemos, createVoiceMemo, deleteVoiceMemo, updateSession } = useAppStore();
  
  const session = sessions.find((s) => s.id === sessionId);
  const existingMemo = voiceMemos.find((v) => v.id === session?.voiceMemoId);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pendingRecording, setPendingRecording] = useState<PendingRecording | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [recordingError, setRecordingError] = useState<RecordingError | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Separate audio players for pending and saved memos
  const pendingPlayer = useAudioPlayer({
    onEnded: () => {
      // Player automatically handles state
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const savedPlayer = useAudioPlayer({
    onEnded: () => {
      // Player automatically handles state
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Cleanup on unmount or panel close
  useEffect(() => {
    if (!open) {
      // Stop any playback when panel closes
      pendingPlayer.stop();
      savedPlayer.stop();
      
      // Clear timer if recording
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      pendingPlayer.stop();
      savedPlayer.stop();
    };
  }, []);

  const startRecording = async () => {
    setIsStarting(true);
    setRecordingError(null);

    try {
      // Check support first
      const supportCheck = await AudioRecorder.checkSupport();
      if (!supportCheck.supported) {
        setRecordingError(supportCheck.error!);
        setIsStarting(false);
        return;
      }

      recorderRef.current = new AudioRecorder();
      const result = await recorderRef.current.start();

      if (!result.success) {
        setRecordingError(result.error!);
        setIsStarting(false);
        return;
      }

      // Recording started successfully
      setIsRecording(true);
      setRecordingTime(0);
      recordingStartTimeRef.current = Date.now();

      // Update timer every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecordingError({
        type: 'unknown',
        message: 'An unexpected error occurred. Please try again or use the fallback option.',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      const { audioData, duration, mimeType } = await recorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Store as pending recording (not saved yet)
      setPendingRecording({ audioData, duration, mimeType });
      toast.info('Recording stopped. Review and save or discard.');
    } catch (err) {
      console.error('Failed to stop recording:', err);
      toast.error('Failed to stop recording');
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFallbackCapture = (audioData: Uint8Array, mimeType: string, duration: number) => {
    setPendingRecording({ audioData, duration, mimeType });
    setRecordingError(null);
    toast.success('Audio imported successfully. Review and save or discard.');
  };

  const handleFallbackError = (message: string) => {
    toast.error(message);
  };

  const savePendingRecording = async () => {
    if (!pendingRecording) return;

    try {
      // Delete old memo if exists
      if (existingMemo) {
        await deleteVoiceMemo(existingMemo.id);
      }

      // Create new memo with MIME type
      const memo = await createVoiceMemo({
        sessionId,
        audioData: pendingRecording.audioData,
        duration: pendingRecording.duration,
        mimeType: pendingRecording.mimeType,
      });

      // Link to session
      await updateSession(sessionId, { voiceMemoId: memo.id });

      setPendingRecording(null);
      pendingPlayer.stop();
      toast.success('Voice memo saved successfully');
    } catch (err) {
      console.error('Failed to save recording:', err);
      toast.error('Failed to save recording');
    }
  };

  const discardPendingRecording = () => {
    setPendingRecording(null);
    pendingPlayer.stop();
    toast.info('Recording discarded');
  };

  const playPendingRecording = () => {
    if (!pendingRecording) return;
    
    // Stop saved memo if playing
    savedPlayer.stop();
    
    pendingPlayer.play(pendingRecording.audioData, pendingRecording.mimeType);
  };

  const pausePendingRecording = () => {
    pendingPlayer.pause();
  };

  const playMemo = () => {
    if (!existingMemo) return;
    
    // Stop pending recording if playing
    pendingPlayer.stop();
    
    savedPlayer.play(existingMemo.audioData, existingMemo.mimeType);
  };

  const pauseMemo = () => {
    savedPlayer.pause();
  };

  const deleteMemo = async () => {
    if (!existingMemo) return;

    savedPlayer.stop();
    await deleteVoiceMemo(existingMemo.id);
    await updateSession(sessionId, { voiceMemoId: undefined });
    toast.success('Voice memo deleted');
  };

  const handleOpenChange = (newOpen: boolean) => {
    // If closing with a pending recording, prompt to save or discard
    if (!newOpen && pendingRecording) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleDiscardAndClose = () => {
    discardPendingRecording();
    setShowDiscardDialog(false);
    onOpenChange(false);
  };

  const handleSaveAndClose = async () => {
    await savePendingRecording();
    setShowDiscardDialog(false);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setRecordingError(null);
    setPendingRecording(null);
    pendingPlayer.stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Voice Memo</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-6">
            {/* Recording Error */}
            {recordingError && !pendingRecording && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-3">
                  <span>{recordingError.message}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Recording Controls */}
            {!pendingRecording && !existingMemo && (
              <div className="space-y-4">
                <div className="text-center">
                  {isRecording ? (
                    <>
                      <div className="text-4xl font-bold text-destructive mb-4">
                        {formatTime(recordingTime)}
                      </div>
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        variant="destructive"
                        className="w-full"
                      >
                        <Square className="mr-2 h-5 w-5" />
                        Stop Recording
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={startRecording}
                        disabled={isStarting || !!recordingError}
                        size="lg"
                        className="w-full mb-4"
                      >
                        <Mic className="mr-2 h-5 w-5" />
                        {isStarting ? 'Starting...' : 'Start Recording'}
                      </Button>

                      {recordingError && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Having trouble recording? Try importing an audio file instead:
                            </p>
                            <FallbackVoiceMemoCaptureButton
                              onCapture={handleFallbackCapture}
                              onError={handleFallbackError}
                              disabled={isRecording}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Pending Recording Review */}
            {pendingRecording && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Review your recording. Save to keep it or discard to record again.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted rounded-lg p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      {formatTime(Math.floor(pendingRecording.duration))}
                    </div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                  </div>

                  {pendingPlayer.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {pendingPlayer.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={pendingPlayer.isPlaying ? pausePendingRecording : playPendingRecording}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      {pendingPlayer.isPlaying ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={savePendingRecording}
                      size="lg"
                      className="flex-1"
                    >
                      <Save className="mr-2 h-5 w-5" />
                      Save
                    </Button>
                    <Button
                      onClick={discardPendingRecording}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Discard
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Memo Playback */}
            {existingMemo && !pendingRecording && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Voice memo saved for this session.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted rounded-lg p-6 space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      {formatTime(Math.floor(existingMemo.duration))}
                    </div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                  </div>

                  {savedPlayer.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex flex-col gap-3">
                        <span>{savedPlayer.error}</span>
                        <Button
                          onClick={() => savedPlayer.clearError()}
                          variant="outline"
                          size="sm"
                        >
                          Dismiss
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={savedPlayer.isPlaying ? pauseMemo : playMemo}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      {savedPlayer.isPlaying ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={deleteMemo}
                      variant="destructive"
                      size="lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Discard Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Recording</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unsaved recording. Do you want to save it before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndClose}>
              Discard
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
