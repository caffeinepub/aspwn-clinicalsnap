// Full-screen before/after comparison overlay with slider and overlay modes

import { useState } from 'react';
import { X, Maximize2, SlidersHorizontal, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface BeforeAfterFullscreenOverlayProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  onClose: () => void;
  initialMode?: 'slider' | 'overlay';
  initialOpacity?: number;
}

export function BeforeAfterFullscreenOverlay({
  beforeImageUrl,
  afterImageUrl,
  onClose,
  initialMode = 'slider',
  initialOpacity = 50,
}: BeforeAfterFullscreenOverlayProps) {
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'overlay'>(initialMode);
  const [overlayOpacity, setOverlayOpacity] = useState(initialOpacity);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="bg-black/90 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Maximize2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Full Screen Comparison</h2>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={comparisonMode === 'slider' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('slider')}
              className="touch-target"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Slider
            </Button>
            <Button
              variant={comparisonMode === 'overlay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('overlay')}
              className="touch-target"
            >
              <Layers className="w-4 h-4 mr-2" />
              Overlay
            </Button>
          </div>
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

      {/* Full-screen comparison */}
      <div className="flex-1 p-4 min-h-0">
        {comparisonMode === 'slider' ? (
          <BeforeAfterSlider
            beforeImageUrl={beforeImageUrl}
            afterImageUrl={afterImageUrl}
          />
        ) : (
          <div className="relative w-full h-full overflow-hidden rounded-lg">
            {/* Before image (background) */}
            <div className="absolute inset-0">
              <img
                src={beforeImageUrl}
                alt="Before"
                className="w-full h-full object-contain"
                draggable={false}
              />
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Before
              </div>
            </div>

            {/* After image (overlay with opacity) */}
            <div
              className="absolute inset-0"
              style={{ opacity: overlayOpacity / 100 }}
            >
              <img
                src={afterImageUrl}
                alt="After"
                className="w-full h-full object-contain"
                draggable={false}
              />
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                After
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with instructions and opacity control */}
      <div className="bg-black/90 p-4">
        {comparisonMode === 'slider' ? (
          <p className="text-white/70 text-sm text-center">
            Drag the slider left or right to compare before and after photos
          </p>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 bg-white/10 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-white whitespace-nowrap">
                Overlay Opacity:
              </span>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs text-white/70">Before</span>
                <Slider
                  value={[overlayOpacity]}
                  onValueChange={(value) => setOverlayOpacity(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-white/70">After</span>
              </div>
              <span className="text-sm font-medium text-white min-w-[3rem] text-right">
                {overlayOpacity}%
              </span>
            </div>
            <p className="text-white/70 text-xs text-center mt-2">
              Adjust the slider to fade between before and after photos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
