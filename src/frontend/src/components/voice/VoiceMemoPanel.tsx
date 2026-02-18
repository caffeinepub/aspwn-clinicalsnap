// Voice memo recording and playback panel

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { AudioRecorder, uint8ArrayToAudioURL } from '@/lib/media/audioMemo';
import { toast } from 'sonner';

interface VoiceMemoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function VoiceMemoPanel({ open, onOpenChange, sessionId }: VoiceMemoPanelProps) {
  const { sessions, voiceMemos, createVoiceMemo, deleteVoiceMemo, updateSession } = useAppStore();
  
  const session = sessions.find((s) => s.id === sessionId);
  const existingMemo = voiceMemos.find((v) => v.id === session?.voiceMemoId);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      const { audioData, duration } = await recorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Delete old memo if exists
      if (existingMemo) {
        await deleteVoiceMemo(existingMemo.id);
      }

      // Create new memo
      const memo = await createVoiceMemo({
        sessionId,
        audioData,
        duration,
      });

      // Link to session
      await updateSession(sessionId, { voiceMemoId: memo.id });

      toast.success('Voice memo saved');
    } catch (err) {
      console.error('Failed to save recording:', err);
      toast.error('Failed to save recording');
    }
  };

  const playMemo = () => {
    if (!existingMemo) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioUrl = uint8ArrayToAudioURL(existingMemo.audioData);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const pauseMemo = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteMemo = async () => {
    if (!existingMemo) return;

    await deleteVoiceMemo(existingMemo.id);
    await updateSession(sessionId, { voiceMemoId: undefined });
    toast.success('Voice memo deleted');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Voice Memo</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center h-full space-y-6">
          {isRecording ? (
            <>
              <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                <Mic className="w-12 h-12 text-destructive" />
              </div>
              <div className="text-3xl font-mono">{formatTime(recordingTime)}</div>
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="touch-target-lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            </>
          ) : existingMemo ? (
            <>
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <Mic className="w-12 h-12 text-primary" />
              </div>
              <div className="text-lg">
                Duration: {formatTime(Math.floor(existingMemo.duration))}
              </div>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={isPlaying ? pauseMemo : playMemo}
                  className="touch-target-lg"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={startRecording}
                  className="touch-target-lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Re-record
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={deleteMemo}
                  className="touch-target-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Mic className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No voice memo recorded</p>
              <Button
                size="lg"
                onClick={startRecording}
                className="touch-target-lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
