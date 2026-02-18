// Photo import button for adding existing images to a session with view template assignment

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/lib/state/useAppStore';
import { captureFileToPhoto } from '@/lib/media/photoStorage';
import { toast } from 'sonner';
import { VIEW_TEMPLATES } from '@/lib/models';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SessionPhotoImportButtonProps {
  sessionId: string;
  patientId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SessionPhotoImportButton({
  sessionId,
  patientId,
  variant = 'ghost',
  size = 'sm',
  className,
}: SessionPhotoImportButtonProps) {
  const { createPhoto } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedViewTemplate, setSelectedViewTemplate] = useState<string>('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      toast.error('No valid image files selected');
      return;
    }

    // Show template selection dialog
    setPendingFiles(fileArray);
    setSelectedViewTemplate('');
    setShowTemplateDialog(true);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportWithTemplate = async () => {
    setShowTemplateDialog(false);
    
    let successCount = 0;
    let failCount = 0;

    // Process files sequentially
    for (const file of pendingFiles) {
      try {
        const photoData = await captureFileToPhoto(
          file,
          sessionId,
          patientId,
          selectedViewTemplate || undefined
        );
        await createPhoto({
          ...photoData,
          sessionId,
          patientId,
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to import ${file.name}:`, err);
        failCount++;
      }
    }

    setPendingFiles([]);

    // Show feedback
    if (successCount > 0 && failCount === 0) {
      toast.success(
        successCount === 1
          ? 'Photo imported successfully'
          : `${successCount} photos imported successfully`
      );
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(
        `${successCount} photo${successCount === 1 ? '' : 's'} imported, ${failCount} failed`
      );
    } else if (failCount > 0) {
      toast.error('Failed to import photos. Please try again with valid image files.');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleImportClick}
        className={className}
        title="Add photos from device"
      >
        <Upload className="w-4 h-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import photos"
      />

      {/* View template selection dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign View Template</DialogTitle>
            <DialogDescription>
              Optionally assign a view template to the imported photo{pendingFiles.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>View Template (Optional)</Label>
              <Select value={selectedViewTemplate} onValueChange={setSelectedViewTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="No template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template</SelectItem>
                  {VIEW_TEMPLATES.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              Importing {pendingFiles.length} photo{pendingFiles.length > 1 ? 's' : ''}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportWithTemplate}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
