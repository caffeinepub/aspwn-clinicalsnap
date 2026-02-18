// Reusable View Template editor dialog for a single photo with Save/Cancel behavior

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VIEW_TEMPLATES } from '@/lib/models';

interface ViewTemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate?: string;
  onSave: (template: string | undefined) => void;
}

export function ViewTemplateEditorDialog({
  open,
  onOpenChange,
  currentTemplate,
  onSave,
}: ViewTemplateEditorDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate || 'none');

  const handleSave = () => {
    const templateToSave = selectedTemplate === 'none' ? undefined : selectedTemplate;
    onSave(templateToSave);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedTemplate(currentTemplate || 'none');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit View Template</DialogTitle>
          <DialogDescription>
            Select a view template for this photo or choose "None" to remove it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="view-template">View Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger id="view-template" className="touch-target">
                <SelectValue placeholder="Select a view template" />
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} className="touch-target">
            Cancel
          </Button>
          <Button onClick={handleSave} className="touch-target">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
