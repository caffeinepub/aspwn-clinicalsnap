// Before/After comparison dialog with photo selection and slider view

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
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { Check } from 'lucide-react';

interface BeforeAfterCompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function BeforeAfterCompareDialog({
  open,
  onOpenChange,
  sessionId,
}: BeforeAfterCompareDialogProps) {
  const { photos } = useAppStore();
  const [beforePhotoId, setBeforePhotoId] = useState<string | null>(null);
  const [afterPhotoId, setAfterPhotoId] = useState<string | null>(null);

  const sessionPhotos = photos
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => a.capturedAt - b.capturedAt);

  const beforePhoto = photos.find((p) => p.id === beforePhotoId);
  const afterPhoto = photos.find((p) => p.id === afterPhotoId);

  const showComparison = beforePhoto && afterPhoto;

  return (
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
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
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
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
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
                  if (beforePhotoId && afterPhotoId) {
                    // Trigger comparison view
                  }
                }}
                disabled={!beforePhotoId || !afterPhotoId}
              >
                Compare Photos
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <BeforeAfterSlider
              beforeImageUrl={uint8ArrayToObjectURL(beforePhoto.imageData)}
              afterImageUrl={uint8ArrayToObjectURL(afterPhoto.imageData)}
            />
            <div className="mt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setBeforePhotoId(null);
                  setAfterPhotoId(null);
                }}
              >
                Select Different Photos
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
