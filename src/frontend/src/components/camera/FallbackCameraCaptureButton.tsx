import { useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface FallbackCameraCaptureButtonProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
  isProcessing?: boolean;
}

export function FallbackCameraCaptureButton({
  onCapture,
  onCancel,
  onError,
  disabled = false,
  disabledMessage,
  isProcessing = false,
}: FallbackCameraCaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (disabled) {
      if (disabledMessage) {
        onError(disabledMessage);
      }
      return;
    }

    // Reset input value to allow re-selection of the same file
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Trigger the file picker
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      // User canceled or no file selected
      onCancel();
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file.');
      return;
    }

    // Pass the file to the parent handler
    onCapture(file);
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
        variant="outline"
        size="lg"
        className="touch-target w-full"
      >
        <Camera className="w-5 h-5 mr-2" />
        {isProcessing ? 'Processing...' : 'Use System Camera'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}
