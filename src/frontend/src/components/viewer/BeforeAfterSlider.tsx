// Swipe-reveal slider for before/after comparison with enhanced touch-friendly controls

import { useState, useRef } from 'react';

interface BeforeAfterSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
}

export function BeforeAfterSlider({ beforeImageUrl, afterImageUrl }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    updatePosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    setIsDragging(false);
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const updatePosition = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* After image (background) */}
      <div className="absolute inset-0">
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

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
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

      {/* Slider handle with enhanced touch target */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center touch-target-xl">
          <div className="flex gap-1">
            <div className="w-1 h-6 bg-gray-600 rounded-full" />
            <div className="w-1 h-6 bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
