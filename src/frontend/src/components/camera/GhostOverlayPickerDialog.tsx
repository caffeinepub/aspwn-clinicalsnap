// Dialog for selecting a reference photo from the current session to use as a ghost overlay, with clear selection and cancellation actions.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Photo } from '@/lib/models';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Check } from 'lucide-react';

interface GhostOverlayPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionPhotos: Photo[];
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string | null) => void;
}

export function GhostOverlayPickerDialog({
  open,
  onOpenChange,
  sessionPhotos,
  selectedPhotoId,
  onSelectPhoto,
}: GhostOverlayPickerDialogProps) {
  const handleSelect = (photoId: string) => {
    onSelectPhoto(photoId);
  };

  const handleClear = () => {
    onSelectPhoto(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Reference Photo</DialogTitle>
          <DialogDescription>
            Choose a photo from this session to use as a ghost overlay for alignment.
          </DialogDescription>
        </DialogHeader>

        {sessionPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No photos available in this session yet.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sessionPhotos.map((photo) => {
                const imageUrl = uint8ArrayToObjectURL(photo.imageData);
                const isSelected = photo.id === selectedPhotoId;

                return (
                  <button
                    key={photo.id}
                    onClick={() => handleSelect(photo.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`Photo ${photo.id}`}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(imageUrl)}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <Check className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                    {photo.viewTemplate && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {photo.viewTemplate}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2 justify-end">
          {selectedPhotoId && (
            <Button onClick={handleClear} variant="outline" className="touch-target">
              Clear Selection
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="touch-target">
            {selectedPhotoId ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
