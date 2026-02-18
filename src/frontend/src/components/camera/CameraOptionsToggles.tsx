// Focused, reusable camera options UI component with labeled toggles for alignment guides, ghost overlay, and view template selection

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Grid3x3, Ghost } from 'lucide-react';
import { VIEW_TEMPLATES } from '@/lib/models';

interface CameraOptionsTogglesProps {
  guidesEnabled: boolean;
  onGuidesChange: (enabled: boolean) => void;
  ghostEnabled: boolean;
  onGhostEnabledChange: (enabled: boolean) => void;
  ghostOpacity: number;
  onGhostOpacityChange: (opacity: number) => void;
  onSelectGhostPhoto: () => void;
  hasGhostPhoto: boolean;
  hasSessionPhotos: boolean;
  selectedViewTemplate: string;
  onViewTemplateChange: (template: string) => void;
}

export function CameraOptionsToggles({
  guidesEnabled,
  onGuidesChange,
  ghostEnabled,
  onGhostEnabledChange,
  ghostOpacity,
  onGhostOpacityChange,
  onSelectGhostPhoto,
  hasGhostPhoto,
  hasSessionPhotos,
  selectedViewTemplate,
  onViewTemplateChange,
}: CameraOptionsTogglesProps) {
  return (
    <div className="space-y-3">
      {/* Alignment guides toggle */}
      <div className="flex items-center justify-between camera-option-row">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-white" />
          <Label htmlFor="guides-toggle" className="text-white text-sm cursor-pointer">
            Alignment Guides
          </Label>
        </div>
        <Switch
          id="guides-toggle"
          checked={guidesEnabled}
          onCheckedChange={onGuidesChange}
        />
      </div>

      {/* Ghost overlay toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between camera-option-row">
          <div className="flex items-center gap-2">
            <Ghost className="w-4 h-4 text-white" />
            <Label htmlFor="ghost-toggle" className="text-white text-sm cursor-pointer">
              Ghost Overlay
            </Label>
          </div>
          <Switch
            id="ghost-toggle"
            checked={ghostEnabled}
            onCheckedChange={onGhostEnabledChange}
            disabled={!hasGhostPhoto}
          />
        </div>

        {/* Ghost photo selection and opacity */}
        {hasSessionPhotos && (
          <div className="pl-6 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectGhostPhoto}
              className="text-white border-white/20 hover:bg-white/10 touch-target"
            >
              {hasGhostPhoto ? 'Change Reference Photo' : 'Select Reference Photo'}
            </Button>

            {hasGhostPhoto && ghostEnabled && (
              <div className="space-y-1">
                <Label htmlFor="ghost-opacity" className="text-white text-xs">
                  Opacity: {ghostOpacity}%
                </Label>
                <Slider
                  id="ghost-opacity"
                  min={10}
                  max={90}
                  step={10}
                  value={[ghostOpacity]}
                  onValueChange={(values) => onGhostOpacityChange(values[0])}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* View template selection */}
      <div className="space-y-2">
        <Label htmlFor="view-template" className="text-white text-sm">
          View Template
        </Label>
        <Select value={selectedViewTemplate || 'none'} onValueChange={onViewTemplateChange}>
          <SelectTrigger id="view-template" className="bg-black/30 text-white border-white/20 touch-target">
            <SelectValue placeholder="Select view template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {VIEW_TEMPLATES.map((template) => (
              <SelectItem key={template} value={template}>
                {template}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
