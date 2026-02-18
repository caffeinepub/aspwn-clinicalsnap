// Camera flip toggle control with clear front/back indication

import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';

interface CameraFlipToggleProps {
  currentFacingMode: 'user' | 'environment';
  onToggle: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function CameraFlipToggle({
  currentFacingMode,
  onToggle,
  disabled = false,
  isLoading = false,
}: CameraFlipToggleProps) {
  const isFrontCamera = currentFacingMode === 'user';

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        disabled={disabled || isLoading}
        className="bg-white/10 text-white border-white/20 hover:bg-white/20 touch-target-lg min-w-[140px]"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Camera className="w-5 h-5 mr-2" />
        )}
        {isFrontCamera ? 'Front Camera' : 'Back Camera'}
      </Button>
      <p className="text-white/60 text-xs">Tap to switch</p>
    </div>
  );
}
