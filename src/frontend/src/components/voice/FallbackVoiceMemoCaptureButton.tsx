// Fallback audio capture/import control using system file picker for iPad Safari compatibility

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { detectAudioMimeType } from '@/lib/media/audioMemo';

interface FallbackVoiceMemoCaptureButtonProps {
  onCapture: (audioData: Uint8Array, mimeType: string, duration: number) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function FallbackVoiceMemoCaptureButton({
  onCapture,
  onError,
  disabled = false,
}: FallbackVoiceMemoCaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input for re-selection
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    try {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        onError('Please select an audio file.');
        return;
      }

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);

      // Detect MIME type from file or use file.type
      const mimeType = file.type || detectAudioMimeType(audioData);

      // Estimate duration by creating a temporary audio element
      // Note: This is approximate and may not work for all formats
      const blob = new Blob([audioData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onloadedmetadata = () => {
        const duration = audio.duration || 0;
        URL.revokeObjectURL(url);
        onCapture(audioData, mimeType, duration);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        // If we can't get duration, use 0 as fallback
        onCapture(audioData, mimeType, 0);
      };

      // Timeout after 3 seconds
      setTimeout(() => {
        if (audio.readyState < 1) {
          URL.revokeObjectURL(url);
          onCapture(audioData, mimeType, 0);
        }
      }, 3000);
    } catch (err) {
      console.error('Failed to import audio:', err);
      onError('Failed to import audio file. Please try again.');
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        capture="user"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="outline"
        size="lg"
        className="w-full"
      >
        <Upload className="mr-2 h-5 w-5" />
        Import Audio File
      </Button>
    </>
  );
}
