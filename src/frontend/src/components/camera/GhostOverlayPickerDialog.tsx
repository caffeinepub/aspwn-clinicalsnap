// Dialog for selecting a reference photo for ghost overlay alignment

import { useAppStore } from '@/lib/state/useAppStore';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface GhostOverlayPickerDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string) => void;
}

export function GhostOverlayPickerDialog({
  open,
  onClose,
  sessionId,
  selectedPhotoId,
  onSelectPhoto,
}: GhostOverlayPickerDialogProps) {
  const { photos } = useAppStore();

  const sessionPhotos = photos
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => b.capturedAt - a.capturedAt);

  const handleSelect = (photoId: string) => {
    onSelectPhoto(photoId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Reference Photo</DialogTitle>
          <DialogDescription>
            Choose a photo to use as a ghost overlay for alignment
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {sessionPhotos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No photos available in this session</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-4">
              {sessionPhotos.map((photo) => {
                const thumbnailUrl = uint8ArrayToObjectURL(photo.thumbnailData);
                const isSelected = photo.id === selectedPhotoId;

                return (
                  <button
                    key={photo.id}
                    onClick={() => handleSelect(photo.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-4 ring-primary'
                        : 'hover:ring-2 hover:ring-primary/50'
                    }`}
                  >
                    <img
                      src={thumbnailUrl}
                      alt="Reference photo"
                      className="w-full h-full object-cover"
                    />
                    {photo.viewTemplate && (
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {photo.viewTemplate}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedPhotoId && (
            <Button variant="destructive" onClick={() => onSelectPhoto('')}>
              Clear Selection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
