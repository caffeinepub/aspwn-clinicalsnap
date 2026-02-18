// Full-screen photo viewer with zoom/pan, annotation tools including stamps, and view template display

import { useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import { uint8ArrayToObjectURL } from '@/lib/media/photoStorage';
import { Button } from '@/components/ui/button';
import { X, Pencil, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { usePanZoom } from '@/hooks/usePanZoom';
import { PhotoAnnotationToolbar, type AnnotationTool } from './PhotoAnnotationToolbar';
import { PhotoAnnotationCanvas } from './PhotoAnnotationCanvas';

export function PhotoViewerOverlay() {
  const { photos, selectedPhotoId, selectPhoto } = useAppStore();
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [annotationColor, setAnnotationColor] = useState('#ef4444');
  const [annotationSize, setAnnotationSize] = useState(3);

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
    setActiveTool(null);
  };

  const handleAnnotateToggle = () => {
    const newAnnotating = !isAnnotating;
    setIsAnnotating(newAnnotating);
    if (!newAnnotating) {
      setActiveTool(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnnotateToggle}
            className={`text-white hover:bg-white/20 ${isAnnotating ? 'bg-white/20' : ''}`}
          >
            <Pencil className="w-4 h-4 mr-2" />
            {isAnnotating ? 'Done' : 'Annotate'}
          </Button>

          {/* View template display */}
          {photo.viewTemplate && (
            <div className="bg-white/10 text-white text-sm px-3 py-1.5 rounded">
              {photo.viewTemplate}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isAnnotating && (
            <>
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
                onClick={zoomOut}
                className="text-white hover:bg-white/20"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
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
            </>
          )}
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
      {isAnnotating && (
        <PhotoAnnotationToolbar
          photoId={photo.id}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          color={annotationColor}
          onColorChange={setAnnotationColor}
          size={annotationSize}
          onSizeChange={setAnnotationSize}
        />
      )}

      {/* Image viewer */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onWheel={isAnnotating ? undefined : handleWheel}
        onPointerDown={isAnnotating ? undefined : handlePointerDown}
        onPointerMove={isAnnotating ? undefined : handlePointerMove}
        onPointerUp={isAnnotating ? undefined : handlePointerUp}
        style={{ touchAction: isAnnotating ? 'none' : 'none' }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: 'none',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Photo"
            className="max-w-full max-h-full object-contain"
            style={{ pointerEvents: isAnnotating ? 'none' : 'auto' }}
          />

          {/* Annotation canvas overlay */}
          {isAnnotating && activeTool && (
            <PhotoAnnotationCanvas
              photoId={photo.id}
              imageWidth={photo.width}
              imageHeight={photo.height}
              activeTool={activeTool}
              color={annotationColor}
              size={annotationSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}
