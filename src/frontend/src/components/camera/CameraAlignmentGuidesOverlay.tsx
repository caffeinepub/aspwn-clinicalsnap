// Visual-only alignment guides overlay for camera capture (grid + crosshair)

interface CameraAlignmentGuidesOverlayProps {
  enabled: boolean;
}

export function CameraAlignmentGuidesOverlay({ enabled }: CameraAlignmentGuidesOverlayProps) {
  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Rule of thirds grid */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Vertical lines */}
        <line
          x1="33.33"
          y1="0"
          x2="33.33"
          y2="100"
          stroke="white"
          strokeWidth="0.2"
          opacity="0.5"
        />
        <line
          x1="66.67"
          y1="0"
          x2="66.67"
          y2="100"
          stroke="white"
          strokeWidth="0.2"
          opacity="0.5"
        />
        {/* Horizontal lines */}
        <line
          x1="0"
          y1="33.33"
          x2="100"
          y2="33.33"
          stroke="white"
          strokeWidth="0.2"
          opacity="0.5"
        />
        <line
          x1="0"
          y1="66.67"
          x2="100"
          y2="66.67"
          stroke="white"
          strokeWidth="0.2"
          opacity="0.5"
        />
      </svg>

      {/* Center crosshair */}
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Vertical center line */}
        <line
          x1="50"
          y1="45"
          x2="50"
          y2="55"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.7"
        />
        {/* Horizontal center line */}
        <line
          x1="45"
          y1="50"
          x2="55"
          y2="50"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.7"
        />
        {/* Center circle */}
        <circle
          cx="50"
          cy="50"
          r="2"
          stroke="white"
          strokeWidth="0.3"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
