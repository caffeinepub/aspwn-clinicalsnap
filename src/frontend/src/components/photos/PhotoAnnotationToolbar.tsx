// Annotation toolbar with pen, highlight, and text tools

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Highlighter, Type, Trash2, Undo } from 'lucide-react';
import { useAppStore } from '@/lib/state/useAppStore';

export type AnnotationTool = 'pen' | 'highlight' | 'text' | null;

interface PhotoAnnotationToolbarProps {
  photoId: string;
}

export function PhotoAnnotationToolbar({ photoId }: PhotoAnnotationToolbarProps) {
  const { annotations, deleteAnnotationsByPhoto } = useAppStore();
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [color, setColor] = useState('#ef4444');
  const [size, setSize] = useState(3);

  const photoAnnotations = annotations.filter((a) => a.photoId === photoId);

  const handleClearAll = async () => {
    if (confirm('Delete all annotations on this photo?')) {
      await deleteAnnotationsByPhoto(photoId);
    }
  };

  const colors = [
    { value: '#ef4444', label: 'Red' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#22c55e', label: 'Green' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#ffffff', label: 'White' },
  ];

  return (
    <div className="bg-black/50 p-3 flex items-center gap-4 border-b border-white/10">
      {/* Tools */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTool(activeTool === 'pen' ? null : 'pen')}
          className={`text-white hover:bg-white/20 ${activeTool === 'pen' ? 'bg-white/20' : ''}`}
          title="Pen"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
          className={`text-white hover:bg-white/20 ${activeTool === 'highlight' ? 'bg-white/20' : ''}`}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
          className={`text-white hover:bg-white/20 ${activeTool === 'text' ? 'bg-white/20' : ''}`}
          title="Text"
        >
          <Type className="w-4 h-4" />
        </Button>
      </div>

      {/* Color picker */}
      {(activeTool === 'pen' || activeTool === 'highlight' || activeTool === 'text') && (
        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 ${
                color === c.value ? 'border-white' : 'border-white/30'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      )}

      {/* Size slider */}
      {(activeTool === 'pen' || activeTool === 'highlight') && (
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Size:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {photoAnnotations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-white hover:bg-white/20"
            title="Clear all annotations"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
