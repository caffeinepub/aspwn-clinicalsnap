// Touch-friendly pan and zoom hook for photo viewer

import { useRef, useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UsePanZoomReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  scale: number;
  position: Position;
  handleWheel: (e: React.WheelEvent) => void;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

export function usePanZoom(): UsePanZoomReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState<Position>({ x: 0, y: 0 });

  // Pinch zoom state
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [pointers, setPointers] = useState<Map<number, Position>>(new Map());

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(5, prev * delta)));
  }, []);

  const getDistance = (p1: Position, p2: Position): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const newPointers = new Map(pointers);
    newPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setPointers(newPointers);

    if (newPointers.size === 1) {
      // Single pointer - start dragging
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLastPosition(position);
    } else if (newPointers.size === 2) {
      // Two pointers - start pinch zoom
      const [p1, p2] = Array.from(newPointers.values());
      setLastDistance(getDistance(p1, p2));
    }
  }, [pointers, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const newPointers = new Map(pointers);
    if (!newPointers.has(e.pointerId)) return;
    
    newPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setPointers(newPointers);

    if (newPointers.size === 2) {
      // Pinch zoom
      const [p1, p2] = Array.from(newPointers.values());
      const distance = getDistance(p1, p2);
      
      if (lastDistance !== null) {
        const delta = distance / lastDistance;
        setScale((prev) => Math.max(0.5, Math.min(5, prev * delta)));
      }
      setLastDistance(distance);
    } else if (newPointers.size === 1 && isDragging) {
      // Pan
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: lastPosition.x + dx,
        y: lastPosition.y + dy,
      });
    }
  }, [pointers, isDragging, dragStart, lastPosition, lastDistance]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    const newPointers = new Map(pointers);
    newPointers.delete(e.pointerId);
    setPointers(newPointers);

    if (newPointers.size === 0) {
      setIsDragging(false);
      setLastDistance(null);
    } else if (newPointers.size === 1) {
      // Transition from pinch to pan
      const [p] = Array.from(newPointers.values());
      setDragStart({ x: p.x, y: p.y });
      setLastPosition(position);
      setIsDragging(true);
      setLastDistance(null);
    }
  }, [pointers, position]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(5, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev / 1.2));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
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
  };
}
