// Annotation toolbar with pen, highlight, text, and stamp tools

import { Button } from '@/components/ui/button';
import { Pencil, Highlighter, Type, Trash2, Undo, Stamp } from 'lucide-react';
import { useAppStore } from '@/lib/state/useAppStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type AnnotationTool = 'pen' | 'highlight' | 'text' | 'stamp' | null;
export type StampType = 'arrow' | 'margin' | 'prep';

interface PhotoAnnotationToolbarProps {
  photoId: string;
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  selectedStampType?: StampType;
  onStampTypeChange?: (type: StampType) => void;
}

export function PhotoAnnotationToolbar({
  photoId,
  activeTool,
  onToolChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  selectedStampType,
  onStampTypeChange,
}: PhotoAnnotationToolbarProps) {
  const { annotations, deleteAnnotationsByPhoto, deleteAnnotation } = useAppStore();

  const photoAnnotations = annotations.filter((a) => a.photoId === photoId);

  const handleClearAll = async () => {
    if (confirm('Delete all annotations on this photo?')) {
      await deleteAnnotationsByPhoto(photoId);
    }
  };

  const handleUndo = async () => {
    if (photoAnnotations.length === 0) return;
    
    // Find the most recent annotation
    const mostRecent = photoAnnotations.reduce((latest, current) => 
      current.createdAt > latest.createdAt ? current : latest
    );
    
    await deleteAnnotation(mostRecent.id);
  };

  const colors = [
    { value: '#ef4444', label: 'Red' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#22c55e', label: 'Green' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#ffffff', label: 'White' },
  ];

  const handleStampSelect = (type: StampType) => {
    onStampTypeChange?.(type);
    onToolChange('stamp');
  };

  return (
    <div className="bg-black/50 p-3 flex items-center gap-4 border-b border-white/10">
      {/* Tools */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToolChange(activeTool === 'pen' ? null : 'pen')}
          className={`text-white hover:bg-white/20 ${activeTool === 'pen' ? 'bg-white/20' : ''}`}
          title="Pen"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToolChange(activeTool === 'highlight' ? null : 'highlight')}
          className={`text-white hover:bg-white/20 ${activeTool === 'highlight' ? 'bg-white/20' : ''}`}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToolChange(activeTool === 'text' ? null : 'text')}
          className={`text-white hover:bg-white/20 ${activeTool === 'text' ? 'bg-white/20' : ''}`}
          title="Text"
        >
          <Type className="w-4 h-4" />
        </Button>

        {/* Stamps dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 ${activeTool === 'stamp' ? 'bg-white/20' : ''}`}
              title="Stamps"
            >
              <Stamp className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleStampSelect('arrow')}>
              Arrow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStampSelect('margin')}>
              Margin line
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStampSelect('prep')}>
              Prep line
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Color picker */}
      {(activeTool === 'pen' || activeTool === 'highlight' || activeTool === 'text' || activeTool === 'stamp') && (
        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => onColorChange(c.value)}
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
      {(activeTool === 'pen' || activeTool === 'highlight' || activeTool === 'stamp') && (
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Size:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {photoAnnotations.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="text-white hover:bg-white/20"
              title="Undo last annotation"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-white hover:bg-white/20"
              title="Clear all annotations"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
