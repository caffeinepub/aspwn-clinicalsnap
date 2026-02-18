// Shared audio playback hook with MIME-aware playback, safe play/pause/stop semantics, and error handling

import { useState, useRef, useEffect } from 'react';

interface UseAudioPlayerOptions {
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function useAudioPlayer(options?: UseAudioPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const play = (audioData: Uint8Array, mimeType?: string) => {
    // Stop any existing playback first
    stop();
    setError(null);

    try {
      // Use provided MIME type or default to audio/mpeg
      const type = mimeType || 'audio/mpeg';
      const blob = new Blob([new Uint8Array(audioData)], { type });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        options?.onEnded?.();
      };

      audio.onerror = (e) => {
        setIsPlaying(false);
        const errorMsg = 'Audio playback failed. The audio format may not be supported.';
        setError(errorMsg);
        options?.onError?.(errorMsg);
        console.error('Audio playback error:', e);
      };

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        const errorMsg = 'Failed to play audio. Please try again.';
        setError(errorMsg);
        setIsPlaying(false);
        options?.onError?.(errorMsg);
        console.error('Failed to play audio:', err);
      });
    } catch (err) {
      const errorMsg = 'Failed to load audio. Please try again.';
      setError(errorMsg);
      setIsPlaying(false);
      options?.onError?.(errorMsg);
      console.error('Failed to create audio:', err);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsPlaying(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isPlaying,
    error,
    play,
    pause,
    stop,
    clearError,
  };
}
