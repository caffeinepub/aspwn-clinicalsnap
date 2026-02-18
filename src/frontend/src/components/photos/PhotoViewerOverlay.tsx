// Full-screen photo viewer with zoom/pan and annotation tools

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Button } from '@/components/ui/button';
import { X, Pencil, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { usePanZoom } from '@/hooks/usePanZoom';
import { PhotoAnnotationToolbar } from './PhotoAnnotationToolbar';
import { PhotoAnnotationCanvas } from './PhotoAnnotationCanvas';

export function PhotoViewerOverlay() {
  const { photos, selectedPhotoId, selectPhoto } = useAppStore();
  const [isAnnotating, setIsAnnotating] = useState(false);

  const photo = photos.find((p) => p.id === selectedPhotoId);

  const {
    containerRef,
    imageRef,
    scale,
    position,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomIn,
    zoomOut,
    reset,
  } = usePanZoom();

  if (!photo) return null;

  const imageUrl = uint8ArrayToObjectURL(photo.imageData);

  const handleClose = () => {
    selectPhoto(null);
    setIsAnnotating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`text-white hover:bg-white/20 ${isAnnotating ? 'bg-white/20' : ''}`}
          >
            <Pencil className="w-4 h-4 mr-2" />
            {isAnnotating ? 'Done' : 'Annotate'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="text-white hover:bg-white/20"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            className="text-white hover:bg-white/20"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-white hover:bg-white/20"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Annotation toolbar */}
      {isAnnotating && <PhotoAnnotationToolbar photoId={photo.id} />}

      {/* Image viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative touch-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease-out',
            }}
            className="relative"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Photo"
              className="max-w-none"
              style={{
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
              }}
              draggable={false}
            />
            {isAnnotating && (
              <PhotoAnnotationCanvas
                photoId={photo.id}
                imageWidth={photo.width}
                imageHeight={photo.height}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
