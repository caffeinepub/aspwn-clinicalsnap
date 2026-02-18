// Visual-only alignment guides overlay with rule-of-thirds grid and center crosshair, strictly non-interactive to avoid blocking camera controls.

export function CameraAlignmentGuidesOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Rule of thirds - vertical lines */}
      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />

      {/* Rule of thirds - horizontal lines */}
      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />

      {/* Center crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Vertical line */}
        <div className="absolute left-1/2 -translate-x-1/2 w-px h-12 bg-white/60" style={{ top: '-24px' }} />
        {/* Horizontal line */}
        <div className="absolute top-1/2 -translate-y-1/2 h-px w-12 bg-white/60" style={{ left: '-24px' }} />
        {/* Center dot */}
        <div className="w-2 h-2 rounded-full bg-white/80 -translate-x-1/2 -translate-y-1/2 absolute left-0 top-0" />
      </div>

      {/* Corner markers for framing */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/50" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/50" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/50" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/50" />
    </div>
  );
}
