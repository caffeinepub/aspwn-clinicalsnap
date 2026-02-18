// Photo thumbnail grid for a session with view template badges

import { useAppStore } from '@/lib/state/useAppStore';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Button } from '@/components/ui/button';
import { MoreVertical, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PhotoThumbnailGridProps {
  sessionId: string;
  onSelect?: () => void;
}

export function PhotoThumbnailGrid({ sessionId, onSelect }: PhotoThumbnailGridProps) {
  const { photos, selectPhoto, deletePhoto } = useAppStore();

  const sessionPhotos = photos
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => a.capturedAt - b.capturedAt);

  if (sessionPhotos.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No photos in this session</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-4">
      {sessionPhotos.map((photo) => {
        const thumbnailUrl = uint8ArrayToObjectURL(photo.thumbnailData);

        return (
          <div key={photo.id} className="relative group aspect-square">
            <button
              onClick={() => {
                selectPhoto(photo.id);
                onSelect?.();
              }}
              className="w-full h-full rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
            >
              <img
                src={thumbnailUrl}
                alt="Photo"
                className="w-full h-full object-cover"
              />
            </button>

            {/* View template badge */}
            {photo.viewTemplate && (
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
                {photo.viewTemplate}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    selectPhoto(photo.id);
                    onSelect?.();
                  }}
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deletePhoto(photo.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
