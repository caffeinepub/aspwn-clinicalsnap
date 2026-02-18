// Canvas overlay for drawing and displaying annotations

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import type { Annotation, PenAnnotation, HighlightAnnotation, TextAnnotation } from '@/lib/models';

interface PhotoAnnotationCanvasProps {
  photoId: string;
  imageWidth: number;
  imageHeight: number;
}

export function PhotoAnnotationCanvas({ photoId, imageWidth, imageHeight }: PhotoAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { annotations, createAnnotation } = useAppStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  const photoAnnotations = annotations.filter((a) => a.photoId === photoId);

  // Render annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each annotation
    photoAnnotations.forEach((annotation) => {
      if (annotation.data.type === 'pen') {
        const data = annotation.data as PenAnnotation;
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;

        ctx.beginPath();
        data.points.forEach((point, i) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      } else if (annotation.data.type === 'highlight') {
        const data = annotation.data as HighlightAnnotation;
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.4;

        ctx.beginPath();
        data.points.forEach((point, i) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (annotation.data.type === 'text') {
        const data = annotation.data as TextAnnotation;
        ctx.fillStyle = data.color;
        ctx.font = `${data.size * 4}px sans-serif`;
        ctx.globalAlpha = 1;
        ctx.fillText(data.text, data.x * canvas.width, data.y * canvas.height);
      }
    });
  }, [photoAnnotations]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setCurrentPoints((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = async () => {
    if (!isDrawing || currentPoints.length === 0) return;

    // Save annotation
    await createAnnotation({
      photoId,
      type: 'pen',
      data: {
        type: 'pen',
        points: currentPoints,
        color: '#ef4444',
        size: 3,
      },
    });

    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
