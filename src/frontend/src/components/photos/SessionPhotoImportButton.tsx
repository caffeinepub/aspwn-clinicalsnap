// Photo import button for adding existing images to a session

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/lib/state/useAppStore';
import { captureFileToPhoto } from '@/lib/media/photoStorage';
import { toast } from 'sonner';

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    let successCount = 0;
    let failCount = 0;

    // Process files sequentially to avoid overwhelming the browser
    for (const file of fileArray) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          failCount++;
          continue;
        }

        // Convert and save
        const photoData = await captureFileToPhoto(file, sessionId, patientId);
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

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
    </>
  );
}
