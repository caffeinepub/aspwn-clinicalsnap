// Full-screen before/after comparison overlay with enlarged slider view

import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface BeforeAfterFullscreenOverlayProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  onClose: () => void;
}

export function BeforeAfterFullscreenOverlay({
  beforeImageUrl,
  afterImageUrl,
  onClose,
}: BeforeAfterFullscreenOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="bg-black/90 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Maximize2 className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Full Screen Comparison</h2>
        </div>
        <Button
          variant="ghost"
          size="lg"
          onClick={onClose}
          className="text-white hover:bg-white/10 touch-target-lg"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Full-screen slider */}
      <div className="flex-1 p-4 min-h-0">
        <BeforeAfterSlider
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
        />
      </div>

      {/* Footer instructions */}
      <div className="bg-black/90 p-4 text-center">
        <p className="text-white/70 text-sm">
          Drag the slider left or right to compare before and after photos
        </p>
      </div>
    </div>
  );
}
