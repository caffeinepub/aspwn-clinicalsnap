// Before/After comparison dialog with photo selection, slider/overlay comparison modes, and fullscreen view

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { BeforeAfterFullscreenOverlay } from './BeforeAfterFullscreenOverlay';
import { Check, Maximize2, SlidersHorizontal, Layers } from 'lucide-react';

interface BeforeAfterCompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

type ComparisonMode = 'slider' | 'overlay';

export function BeforeAfterCompareDialog({
  open,
  onOpenChange,
  sessionId,
}: BeforeAfterCompareDialogProps) {
  const { photos } = useAppStore();
  const [beforePhotoId, setBeforePhotoId] = useState<string | null>(null);
  const [afterPhotoId, setAfterPhotoId] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  const sessionPhotos = photos
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => a.capturedAt - b.capturedAt);

  const beforePhoto = photos.find((p) => p.id === beforePhotoId);
  const afterPhoto = photos.find((p) => p.id === afterPhotoId);

  const showComparison = beforePhoto && afterPhoto;

  const beforeImageUrl = beforePhoto ? uint8ArrayToObjectURL(beforePhoto.imageData) : '';
  const afterImageUrl = afterPhoto ? uint8ArrayToObjectURL(afterPhoto.imageData) : '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Before/After Comparison</DialogTitle>
            <DialogDescription>
              Select a before photo and an after photo to compare
            </DialogDescription>
          </DialogHeader>

          {!showComparison ? (
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Before selection */}
                <div className="flex flex-col">
                  <h3 className="font-semibold mb-3">Before Photo</h3>
                  <ScrollArea className="flex-1">
                    <div className="grid grid-cols-2 gap-2 pr-4">
                      {sessionPhotos.map((photo) => {
                        const thumbnailUrl = uint8ArrayToObjectURL(photo.thumbnailData);
                        const isSelected = beforePhotoId === photo.id;

                        return (
                          <button
                            key={photo.id}
                            onClick={() => setBeforePhotoId(photo.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all touch-target ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary'
                                : 'border-transparent hover:border-muted-foreground'
                            }`}
                          >
                            <img
                              src={thumbnailUrl}
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* After selection */}
                <div className="flex flex-col">
                  <h3 className="font-semibold mb-3">After Photo</h3>
                  <ScrollArea className="flex-1">
                    <div className="grid grid-cols-2 gap-2 pr-4">
                      {sessionPhotos.map((photo) => {
                        const thumbnailUrl = uint8ArrayToObjectURL(photo.thumbnailData);
                        const isSelected = afterPhotoId === photo.id;

                        return (
                          <button
                            key={photo.id}
                            onClick={() => setAfterPhotoId(photo.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all touch-target ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary'
                                : 'border-transparent hover:border-muted-foreground'
                            }`}
                          >
                            <img
                              src={thumbnailUrl}
                              alt="After"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    // Comparison view will show automatically when both are selected
                  }}
                  disabled={!beforePhotoId || !afterPhotoId}
                  className="touch-target"
                >
                  Compare Photos
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Mode toggle */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Comparison Mode:</span>
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

              {/* Comparison view */}
              <div className="flex-1 min-h-0">
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

              {/* Overlay opacity control */}
              {comparisonMode === 'overlay' && (
                <div className="mt-4 px-4 py-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium whitespace-nowrap">
                      Overlay Opacity:
                    </span>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Before</span>
                      <Slider
                        value={[overlayOpacity]}
                        onValueChange={(value) => setOverlayOpacity(value[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">After</span>
                    </div>
                    <span className="text-sm font-medium min-w-[3rem] text-right">
                      {overlayOpacity}%
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBeforePhotoId(null);
                    setAfterPhotoId(null);
                  }}
                  className="touch-target"
                >
                  Select Different Photos
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFullscreen(true)}
                    className="touch-target"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Full Screen
                  </Button>
                  <Button onClick={() => onOpenChange(false)} className="touch-target">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen overlay */}
      {showFullscreen && showComparison && (
        <BeforeAfterFullscreenOverlay
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          onClose={() => setShowFullscreen(false)}
          initialMode={comparisonMode}
          initialOpacity={overlayOpacity}
        />
      )}
    </>
  );
}
