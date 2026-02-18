// Canvas overlay for drawing and displaying annotations including stamps

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/state/useAppStore';
import type { Annotation, PenAnnotation, HighlightAnnotation, TextAnnotation, StampAnnotation } from '@/lib/models';
import type { AnnotationTool } from './PhotoAnnotationToolbar';

interface PhotoAnnotationCanvasProps {
  photoId: string;
  imageWidth: number;
  imageHeight: number;
  activeTool: AnnotationTool;
  color: string;
  size: number;
  selectedStampType?: 'arrow' | 'margin' | 'prep';
}

export function PhotoAnnotationCanvas({
  photoId,
  imageWidth,
  imageHeight,
  activeTool,
  color,
  size,
  selectedStampType = 'arrow',
}: PhotoAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { annotations, createAnnotation } = useAppStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [stampStart, setStampStart] = useState<{ x: number; y: number } | null>(null);
  const [stampEnd, setStampEnd] = useState<{ x: number; y: number } | null>(null);

  const photoAnnotations = annotations.filter((a) => a.photoId === photoId);

  // Draw stamp helper functions
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    lineWidth: number,
    strokeColor: string
  ) => {
    const headLength = lineWidth * 4;
    const angle = Math.atan2(endY - startY, endX - startX);

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const drawMarginLine = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    lineWidth: number,
    strokeColor: string
  ) => {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const drawPrepLine = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    lineWidth: number,
    strokeColor: string
  ) => {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth * 1.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Add perpendicular end caps
    const angle = Math.atan2(endY - startY, endX - startX);
    const capLength = lineWidth * 3;

    // Start cap
    ctx.beginPath();
    ctx.moveTo(
      startX + capLength * Math.cos(angle + Math.PI / 2),
      startY + capLength * Math.sin(angle + Math.PI / 2)
    );
    ctx.lineTo(
      startX - capLength * Math.cos(angle + Math.PI / 2),
      startY - capLength * Math.sin(angle + Math.PI / 2)
    );
    ctx.stroke();

    // End cap
    ctx.beginPath();
    ctx.moveTo(
      endX + capLength * Math.cos(angle + Math.PI / 2),
      endY + capLength * Math.sin(angle + Math.PI / 2)
    );
    ctx.lineTo(
      endX - capLength * Math.cos(angle + Math.PI / 2),
      endY - capLength * Math.sin(angle + Math.PI / 2)
    );
    ctx.stroke();
  };

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
      } else if (annotation.data.type === 'stamp') {
        const data = annotation.data as StampAnnotation;
        const startX = data.startX * canvas.width;
        const startY = data.startY * canvas.height;
        const endX = data.endX * canvas.width;
        const endY = data.endY * canvas.height;

        if (data.stampType === 'arrow') {
          drawArrow(ctx, startX, startY, endX, endY, data.size, data.color);
        } else if (data.stampType === 'margin') {
          drawMarginLine(ctx, startX, startY, endX, endY, data.size, data.color);
        } else if (data.stampType === 'prep') {
          drawPrepLine(ctx, startX, startY, endX, endY, data.size, data.color);
        }
      }
    });

    // Draw current stroke while drawing
    if (isDrawing && currentPoints.length > 0 && (activeTool === 'pen' || activeTool === 'highlight')) {
      ctx.strokeStyle = color;
      ctx.lineWidth = activeTool === 'highlight' ? size * 3 : size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlight' ? 0.4 : 1;

      ctx.beginPath();
      currentPoints.forEach((point, i) => {
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
    }

    // Draw current stamp preview
    if (activeTool === 'stamp' && stampStart && stampEnd) {
      const startX = stampStart.x * canvas.width;
      const startY = stampStart.y * canvas.height;
      const endX = stampEnd.x * canvas.width;
      const endY = stampEnd.y * canvas.height;

      if (selectedStampType === 'arrow') {
        drawArrow(ctx, startX, startY, endX, endY, size, color);
      } else if (selectedStampType === 'margin') {
        drawMarginLine(ctx, startX, startY, endX, endY, size, color);
      } else if (selectedStampType === 'prep') {
        drawPrepLine(ctx, startX, startY, endX, endY, size, color);
      }
    }
  }, [photoAnnotations, isDrawing, currentPoints, activeTool, color, size, stampStart, stampEnd, selectedStampType]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text && text.trim()) {
        createAnnotation({
          photoId,
          type: 'text',
          data: {
            type: 'text',
            text: text.trim(),
            x,
            y,
            color,
            size,
          },
        });
      }
    } else if (activeTool === 'stamp') {
      setStampStart({ x, y });
      setStampEnd({ x, y });
      setIsDrawing(true);
    } else {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeTool || activeTool === 'text') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'stamp') {
      setStampEnd({ x, y });
    } else {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (activeTool === 'stamp' && stampStart && stampEnd) {
      await createAnnotation({
        photoId,
        type: 'stamp',
        data: {
          type: 'stamp',
          stampType: selectedStampType,
          startX: stampStart.x,
          startY: stampStart.y,
          endX: stampEnd.x,
          endY: stampEnd.y,
          color,
          size,
        },
      });
      setStampStart(null);
      setStampEnd(null);
    } else if (currentPoints.length > 0) {
      if (activeTool === 'pen') {
        await createAnnotation({
          photoId,
          type: 'pen',
          data: {
            type: 'pen',
            points: currentPoints,
            color,
            size,
          },
        });
      } else if (activeTool === 'highlight') {
        await createAnnotation({
          photoId,
          type: 'highlight',
          data: {
            type: 'highlight',
            points: currentPoints,
            color,
            size,
          },
        });
      }
      setCurrentPoints([]);
    }

    setIsDrawing(false);

    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setStampStart(null);
    setStampEnd(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
}
